"""Asymmetric visible envelope catches mislabeled edge ordering in film evidence."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

import cv2
import numpy as np


class FilmReviewMargins(unittest.TestCase):
    def test_edge_order_and_empty_frame(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            video = root / 'asymmetric.mkv'
            writer = cv2.VideoWriter(str(video), cv2.VideoWriter_fourcc(*'FFV1'), 24, (200, 120))
            self.assertTrue(writer.isOpened())
            visible = np.zeros((120, 200, 3), dtype=np.uint8)
            visible[30:71, 40:141] = 255
            writer.write(visible)
            writer.write(np.zeros_like(visible))
            writer.release()
            prefix = root / 'review'
            subprocess.run([sys.executable, str(Path(__file__).resolve().parents[1] / 'scripts/review-wisp-film.py'), str(video), str(prefix)], check=True, capture_output=True)
            report = json.loads(prefix.with_suffix('.json').read_text())
            self.assertEqual(report['schemaVersion'], 2)
            self.assertEqual(report['marginOrder'], ['left', 'top', 'right', 'bottom'])
            expected = [.2, .25, .295, 49/120]
            for threshold in ('4', '8', '16'):
                envelope = report['frames'][0]['envelopes'][threshold]
                self.assertEqual(envelope['boundsXYXY'], [40, 30, 141, 71])
                self.assertEqual(envelope['marginsLTRB'], expected)
                self.assertTrue(envelope['reservePass'])
                self.assertTrue(report['frames'][1]['envelopes'][threshold]['empty'])
                self.assertEqual(report['thresholdSummaries'][threshold]['minimumMarginsLTRB'], expected)
                self.assertEqual(report['thresholdSummaries'][threshold]['emptyFrames'], 1)


if __name__ == '__main__':
    unittest.main()
