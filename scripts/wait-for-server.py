import time,urllib.request
for attempt in range(50):
 try:
  with urllib.request.urlopen('http://127.0.0.1:8770/api/status',timeout=1) as response:
   if response.status==200:break
 except OSError:time.sleep(.1)
else:raise SystemExit('Local rehearsal server did not start.')
