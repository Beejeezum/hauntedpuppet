"""POSIX process-group deadline for the isolated SDK pilot; no SDK imports."""
import os
import signal
import subprocess
import time

MAX_WALL_SECONDS = 35


def group_absent(group):
    """A denied signal can race an already-removed macOS group; verify, don't retry."""
    try:
        result = subprocess.run(['ps', '-axo', 'pgid='], capture_output=True,
                                text=True, check=True, timeout=1)
        groups = [int(row.strip()) for row in result.stdout.splitlines() if row.strip()]
        return bool(groups) and group not in groups
    except (OSError, ValueError, subprocess.SubprocessError):
        return False  # Unknown is not successful cleanup.


def supervise(command, *, env=None, wall_seconds=MAX_WALL_SECONDS, grace_seconds=2, done_file=None):
    """Stop the entire child group on completion, timeout or parent cancellation.

    Output is intentionally suppressed: SDK logging must not expose private setup.
    This bounds local processes, not a remote provider's actual cancellation time.
    """
    if os.name != 'posix':
        raise RuntimeError('Pilot supervisor requires POSIX process groups')
    if not 0 < wall_seconds <= MAX_WALL_SECONDS or not 0 < grace_seconds <= 2:
        raise ValueError('Supervisor timing limits may only be reduced')
    process = subprocess.Popen(command, env=env, start_new_session=True,
                               stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL,
                               stderr=subprocess.DEVNULL)
    started = time.monotonic()
    timed_out = False
    cleanup_errors = []
    try:
        completed = False
        while process.poll() is None:
            if done_file and os.path.exists(done_file):
                completed = True
                break
            if time.monotonic() - started >= wall_seconds:
                timed_out = True
                break
            time.sleep(.02)
        return_code = process.poll()
    finally:
        # The SDK can create job subprocesses. Clean the group even if its root exited.
        try:
            os.killpg(process.pid, signal.SIGTERM)
        except ProcessLookupError:
            pass
        except PermissionError:
            if not group_absent(process.pid):
                cleanup_errors.append('terminate-group-denied')
        try:
            process.wait(timeout=grace_seconds)
        except subprocess.TimeoutExpired:
            pass
        finally:
            try:
                os.killpg(process.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            except PermissionError:
                if not group_absent(process.pid):
                    cleanup_errors.append('kill-group-denied')
            try:
                process.wait(timeout=grace_seconds)
            except subprocess.TimeoutExpired:
                cleanup_errors.append('root-still-running')
    return {'returnCode': return_code, 'timedOut': timed_out,
            'completionSignal': completed, 'cleanupErrors': cleanup_errors, 'elapsedSeconds': round(time.monotonic() - started, 3)}
