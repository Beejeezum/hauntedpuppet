MediaPipe Tasks Vision 1.1.1, published npm package @mediapipe/tasks-vision.
Source: https://github.com/google-ai-edge/mediapipe . Apache License2.0 retained in LICENSE.
Unmodified npm vision_bundle.mjs and ES-module WebAssembly loader/binary.
Official Face Landmarker model, pinned version1 float16:
https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task
Documentation/model cards: https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker
Runtime inference stays in a local worker; this application does not upload frames or record them.

Official Hand Landmarker model, pinned version 1 float16 (unmodified):
https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task
SHA256: fbc2a30080c3c557093b5ddfc334698132eb341044ccee322ccf8bcf3607cde1
Documentation/model card: https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker
Local worker shares the existing operator video, with at most one frame in flight.
