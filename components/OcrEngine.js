import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

const HTML = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"></script>
  </head>
  <body>
    <script>
      var worker = null;
      var workerPromise = null;

      function send(payload) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }

      function loadImage(src) {
        return new Promise(function (resolve, reject) {
          var img = new Image();
          img.onload = function () { resolve(img); };
          img.onerror = reject;
          img.src = src;
        });
      }

      function ensureWorker() {
        if (worker) return Promise.resolve(worker);
        if (workerPromise) return workerPromise;
        workerPromise = Tesseract.createWorker("eng", 1).then(function (created) {
          worker = created;
          send({ workerReady: true });
          return worker;
        });
        return workerPromise;
      }

      function cardFrame(img) {
        var ratio = 85.6 / 54.0;
        var w = img.width * 0.94;
        var h = w / ratio;
        if (h > img.height * 0.52) {
          h = img.height * 0.52;
          w = h * ratio;
        }
        return {
          x: (img.width - w) / 2,
          y: (img.height - h) / 2,
          w: w,
          h: h,
        };
      }

      function cropPlate(img) {
        var ratio = 4.6;
        var w = img.width * 0.90;
        var h = w / ratio;
        if (h > img.height * 0.28) {
          h = img.height * 0.28;
          w = h * ratio;
        }
        var box = {
          x: (img.width - w) / 2,
          y: (img.height - h) / 2,
          w: w,
          h: h,
        };
        var width = 900;
        var height = 180;
        function drawVariant(invert) {
          var canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          var ctx = canvas.getContext("2d");
          ctx.imageSmoothingEnabled = true;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, box.x, box.y, box.w, box.h, 0, 0, width, height);
          var data = ctx.getImageData(0, 0, width, height);
          var px = data.data;
          for (var i = 0; i < px.length; i += 4) {
            var g = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
            if (invert) g = 255 - g;
            g = g * 1.45 - 40;
            if (g > 170) g = 255;
            else if (g < 85) g = 0;
            px[i] = px[i + 1] = px[i + 2] = g;
          }
          ctx.putImageData(data, 0, 0);
          return canvas;
        }
        var normal = drawVariant(false);
        var inverted = drawVariant(true);
        var stacked = document.createElement("canvas");
        stacked.width = width;
        stacked.height = height * 2 + 20;
        var sctx = stacked.getContext("2d");
        sctx.fillStyle = "#ffffff";
        sctx.fillRect(0, 0, stacked.width, stacked.height);
        sctx.drawImage(normal, 0, 0);
        sctx.drawImage(inverted, 0, height + 20);
        return stacked.toDataURL("image/jpeg", 0.86);
      }

      function regionBox(img) {
        return {
          x: img.width * 0.11,
          y: img.height * 0.33,
          w: img.width * 0.78,
          h: img.height * 0.34,
        };
      }

      function cropIdentity(img) {
        var c = cardFrame(img);
        var bands = [
          { x: c.x, y: c.y, w: c.w, h: c.h },
          { x: c.x + c.w * 0.02, y: c.y + c.h * 0.12, w: c.w * 0.70, h: c.h * 0.22 },
          { x: c.x + c.w * 0.02, y: c.y + c.h * 0.42, w: c.w * 0.62, h: c.h * 0.16 },
          { x: c.x + c.w * 0.02, y: c.y + c.h * 0.58, w: c.w * 0.62, h: c.h * 0.16 },
          { x: c.x + c.w * 0.02, y: c.y + c.h * 0.74, w: c.w * 0.68, h: c.h * 0.22 },
        ];
        var width = 720;
        var heights = bands.map(function (band) {
          return Math.max(1, Math.round(band.h * (width / band.w)));
        });
        var gap = 16;
        var canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = heights.reduce(function (sum, h) { return sum + h; }, 0) + gap * (bands.length - 1);
        var ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = true;
        var top = 0;
        bands.forEach(function (band, index) {
          ctx.drawImage(img, band.x, band.y, band.w, band.h, 0, top, width, heights[index]);
          top += heights[index] + gap;
        });
        return canvas.toDataURL("image/jpeg", 0.86);
      }

      function cropRegion(img, box, maxW) {
        var scale = Math.min(1, maxW / box.w);
        var canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(box.w * scale));
        canvas.height = Math.max(1, Math.round(box.h * scale));
        var ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(img, box.x, box.y, box.w, box.h, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/jpeg", 0.62);
      }

      var ocrBusy = false;
      var latestOcr = null;

      window.startOcr = function (base64, mode, jobId) {
        latestOcr = { base64: base64, mode: mode, jobId: jobId || "" };
        runLatestOcr();
      };

      async function runLatestOcr() {
        if (ocrBusy) return;
        ocrBusy = true;
        while (latestOcr) {
          var req = latestOcr;
          latestOcr = null;
          try {
            var img = await loadImage("data:image/jpeg;base64," + req.base64);
            var prepared = req.mode === "ic"
              ? cropIdentity(img)
              : req.mode === "plate"
                ? cropPlate(img)
                : cropRegion(img, regionBox(img), 480);
            var activeWorker = await ensureWorker();
            await activeWorker.setParameters({
              tessedit_pageseg_mode: req.mode === "plate" ? "6" : "4",
              tessedit_char_whitelist: req.mode === "plate"
                ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 "
                : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-'/ ",
              tessedit_enable_doc_dict: "0",
              load_system_dawg: "0",
              load_freq_dawg: "0",
            });
            var result = await activeWorker.recognize(prepared);
            send({ ok: true, text: (result && result.data && result.data.text) || "", mode: req.mode, jobId: req.jobId });
          } catch (error) {
            send({ ok: false, error: String((error && error.message) || error), mode: req.mode, jobId: req.jobId });
          }
        }
        ocrBusy = false;
        if (latestOcr) runLatestOcr();
      }

      send({ ready: true });
      ensureWorker().catch(function () {
        send({ workerError: true });
      });
    </script>
  </body>
</html>`;

const OcrEngine = ({ imageBase64, mode = "ic", jobId = "", preload = false, onResult }) => {
  const webRef = useRef(null);
  const readyRef = useRef(false);
  const startedRef = useRef(false);

  const run = () => {
    if (!readyRef.current || !imageBase64 || startedRef.current) return;
    startedRef.current = true;
    const js = `window.startOcr(${JSON.stringify(imageBase64)}, ${JSON.stringify(mode)}, ${JSON.stringify(String(jobId || ""))}); true;`;
    webRef.current?.injectJavaScript(js);
  };

  useEffect(() => {
    startedRef.current = false;
    run();
  }, [imageBase64, mode, jobId]);

  if (!imageBase64 && !preload) return null;

  return (
    <View style={styles.hidden} pointerEvents="none">
      <WebView
        ref={webRef}
        source={{ html: HTML }}
        originWhitelist={["*"]}
        javaScriptEnabled
        cacheEnabled
        onMessage={(event) => {
          try {
            const payload = JSON.parse(event.nativeEvent.data);
            if (payload.ready || payload.workerReady || payload.workerError) {
              readyRef.current = true;
              run();
              return;
            }
            onResult?.(payload);
          } catch {
            onResult?.({ ok: false, error: "Could not read the document." });
          }
        }}
      />
    </View>
  );
};

export default OcrEngine;

const styles = StyleSheet.create({
  hidden: { position: "absolute", width: 8, height: 8, opacity: 0.01, overflow: "hidden" },
});
