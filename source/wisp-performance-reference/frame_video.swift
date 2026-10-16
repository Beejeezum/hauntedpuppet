import Foundation
import AVFoundation
import CoreGraphics
let input=URL(fileURLWithPath:CommandLine.arguments[1])
let output=URL(fileURLWithPath:CommandLine.arguments[2])
let asset=AVURLAsset(url:input)
let track=asset.tracks(withMediaType:.video)[0]
let size=CGSize(width:1280,height:720)
let composition=AVMutableVideoComposition()
composition.renderSize=size
composition.frameDuration=CMTime(value:1,timescale:24)
let instruction=AVMutableVideoCompositionInstruction()
instruction.timeRange=CMTimeRange(start:.zero,duration:asset.duration)
instruction.backgroundColor=CGColor(gray:0,alpha:1)
let layer=AVMutableVideoCompositionLayerInstruction(assetTrack:track)
let scale:CGFloat=0.84
let transform=CGAffineTransform(a:scale,b:0,c:0,d:scale,tx:size.width*(1-scale)/2,ty:size.height*(1-scale)/2)
layer.setTransform(transform,at:.zero)
instruction.layerInstructions=[layer]
composition.instructions=[instruction]
let export=AVAssetExportSession(asset:asset,presetName:AVAssetExportPresetHighestQuality)!
export.outputURL=output
export.outputFileType = .mp4
export.videoComposition=composition
export.shouldOptimizeForNetworkUse=true
let sem=DispatchSemaphore(value:0)
export.exportAsynchronously{sem.signal()}
sem.wait()
if export.status != .completed {fatalError(String(describing:export.error))}
print("Exported uniformly scaled complete effect at 84% with black surround")
