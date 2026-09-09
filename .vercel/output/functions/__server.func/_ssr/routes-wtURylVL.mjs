import { i as __toESM } from "../_runtime.mjs";
import { L as require_react, v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-wtURylVL.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var markup_default = "<div class=\"top-progress\" id=\"top-progress\"></div>\n<div class=\"app catalog-mode\">\n  <div class=\"sb-backdrop\" id=\"sb-backdrop\" onclick=\"toggleSB()\"></div>\n\n  <aside class=\"sidebar\" id=\"sidebar\">\n    <div class=\"sb-head\">\n      <div class=\"sb-nav-actions\">\n        <button class=\"sb-nav-btn active\" id=\"sb-home-btn\" onclick=\"goHome()\" title=\"Trang chủ\" aria-label=\"Trang chủ\">\n          <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 10.5 12 3l9 7.5\"/><path d=\"M5 9.5V21h14V9.5\"/><path d=\"M9 21v-6h6v6\"/></svg>\n        </button>\n      </div>\n      <div class=\"sb-head-copy-only\">\n        <h2 id=\"sb-title\">Dominic Academy</h2>\n        <div id=\"sb-tag\"></div>\n      </div>\n    </div>\n    <div class=\"sb-search\">\n      <div class=\"sb-search-row\">\n        <div class=\"sb-search-input-wrap\"><input type=\"text\" id=\"search\" placeholder=\"Tìm kiếm bài giảng\" oninput=\"filterLessons(this.value)\"></div>\n\n      </div>\n    </div>\n    <div class=\"sb-body\" id=\"sb-body\"><div class=\"state\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 19.5A2.5 2.5 0 0 1 6.5 17H20\"/><path d=\"M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z\"/></svg><p>Chọn một khoá học để xem danh sách bài học</p></div></div>\n  </aside>\n\n  <main class=\"main\">\n    <div class=\"topbar\">\n      <button class=\"icon-btn\" onclick=\"toggleSB()\" title=\"Danh sách bài học\">\n        <svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n          <line x1=\"3\" y1=\"6\" x2=\"21\" y2=\"6\"/><line x1=\"3\" y1=\"12\" x2=\"21\" y2=\"12\"/><line x1=\"3\" y1=\"18\" x2=\"21\" y2=\"18\"/>\n        </svg>\n      </button>\n      <div class=\"topbar-title-wrap\"><button class=\"topbar-home-btn\" id=\"topbar-home-btn\" type=\"button\" onclick=\"goHome()\" title=\"Trang chủ\" aria-label=\"Trang chủ\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.15\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 10.5 12 3l9 7.5\"/><path d=\"M5 9.5V21h14V9.5\"/><path d=\"M9 21v-6h6v6\"/></svg><img class=\"topbar-logo\" src=\"https://d21acfi38wn3iy.cloudfront.net/resource/documents/fd3ced5d-236b-4594-9969-de8c644bf4d7/1786630765679-favicon-png.png\" alt=\"Dominic\" width=\"28\" height=\"28\"></button><div class=\"topbar-title-only\" id=\"top-title\">Hôm nay bạn muốn học gì?</div></div>\n      <div class=\"topbar-actions\">\n      <button class=\"saved-header-btn\" id=\"saved-header-btn\" type=\"button\" onclick=\"showSavedLessons()\" title=\"Bài học đã lưu\" aria-label=\"Bài học đã lưu\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M6 3.5h12v17l-6-3.8-6 3.8z\"/></svg><span>Đã lưu</span></button>\n      <button class=\"btn-support\" id=\"btn-support\" onclick=\"openModal()\">\n        <svg viewBox=\"0 0 24 24\" width=\"15\" height=\"15\" fill=\"currentColor\"><path d=\"M13.09 11.5h7.64v1.64h-7.64M13.09 8.77h7.64v1.64h-7.64M13.09 14.23h7.64v1.64h-7.64M21.82 2.73H2.18C.98 2.73 0 3.71 0 4.91v14.18c0 1.2.98 2.18 2.18 2.18h19.64c1.2 0 2.18-.98 2.18-2.18V4.91c0-1.2-.98-2.18-2.18-2.18M21.82 19.09H12V4.91h9.82\"/></svg>\n        <span>Hỗ trợ bài học</span>\n      </button>\n      <button class=\"auth-toggle\" id=\"auth-toggle\" type=\"button\" title=\"Cài đặt mã truy cập\">\n        <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4\"/></svg>\n        <span>Mã truy cập</span>\n      </button>\n      </div>\n\n    </div>\n\n    <div id=\"backup-notice\"></div>\n\n    <div id=\"auth-panel\" role=\"dialog\" aria-label=\"Mã truy cập\">\n      <div class=\"auth-panel-box\" onclick=\"event.stopPropagation()\">\n        <div class=\"auth-panel-top\">\n          <h3>Mã truy cập</h3>\n          <button type=\"button\" class=\"auth-panel-x\" id=\"auth-panel-close\" aria-label=\"Đóng\">\n            <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.2\" stroke-linecap=\"round\"><path d=\"M6 6l12 12M18 6L6 18\"/></svg>\n          </button>\n        </div>\n        <div class=\"auth-panel-body\" id=\"auth-teacher-list\"></div>\n      </div>\n    </div>\n    <div class=\"content\" id=\"content\">\n      <div class=\"state\"><div class=\"spinner\"></div><p id=\"loading-txt\">Đang nạp cấu hình hệ thống...</p></div>\n    </div>\n  </main>\n</div>\n\n\n<div class=\"bottom-nav\" id=\"bottom-nav\">\n  <button class=\"bn-item active\" id=\"bn-home\" onclick=\"goHome()\">\n    <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 11l9-8 9 8\"/><path d=\"M5 10v10h14V10\"/></svg>\n    Trang chủ\n  </button>\n  <button class=\"bn-item\" id=\"bn-lessons\" onclick=\"toggleSB()\">\n    <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><line x1=\"3\" y1=\"6\" x2=\"21\" y2=\"6\"/><line x1=\"3\" y1=\"12\" x2=\"21\" y2=\"12\"/><line x1=\"3\" y1=\"18\" x2=\"21\" y2=\"18\"/></svg>\n    Bài học\n  </button>\n  <button class=\"bn-item\" id=\"bn-support\" onclick=\"openModal()\" disabled>\n    <svg viewBox=\"0 0 24 24\" width=\"21\" height=\"21\" fill=\"currentColor\"><path d=\"M13.09 11.5h7.64v1.64h-7.64M13.09 8.77h7.64v1.64h-7.64M13.09 14.23h7.64v1.64h-7.64M21.82 2.73H2.18C.98 2.73 0 3.71 0 4.91v14.18c0 1.2.98 2.18 2.18 2.18h19.64c1.2 0 2.18-.98 2.18-2.18V4.91c0-1.2-.98-2.18-2.18-2.18M21.82 19.09H12V4.91h9.82\"/></svg>\n    Hỗ trợ\n  </button>\n</div>\n\n<div class=\"modal-overlay\" id=\"lesson-modal\" onclick=\"closeModal(event)\">\n  <div class=\"modal-box\" onclick=\"event.stopPropagation()\">\n    <div class=\"modal-head\">\n      <h3 id=\"modal-title\"></h3>\n      <button class=\"close-btn\" onclick=\"closeModal(true)\"><svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"></line><line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"></line></svg></button>\n    </div>\n    <div class=\"modal-body\" id=\"modal-content\"></div>\n    <div class=\"modal-footer\"><button type=\"button\" class=\"modal-close-btn\" onclick=\"closeModal(true)\">Đóng</button></div>\n  </div>\n</div>\n";
var SCRIPTS = [
	"https://cdn.jsdelivr.net/npm/hls.js@latest",
	"https://cdn.plyr.io/3.8.4/plyr.js",
	"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js",
	"/dominic-app.js"
];
function loadScript(src) {
	return new Promise((resolve, reject) => {
		const existing = document.querySelector(`script[data-dominic-src="${src}"]`);
		if (existing) {
			if (existing.dataset.loaded === "1") resolve();
			else existing.addEventListener("load", () => resolve(), { once: true });
			return;
		}
		const el = document.createElement("script");
		el.src = src;
		el.async = false;
		el.dataset.dominicSrc = src;
		el.onload = () => {
			el.dataset.loaded = "1";
			resolve();
		};
		el.onerror = () => reject(/* @__PURE__ */ new Error(`Không tải được ${src}`));
		document.body.appendChild(el);
	});
}
function DominicApp() {
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		(async () => {
			try {
				for (const src of SCRIPTS) {
					await loadScript(src);
					if (cancelled) return;
				}
				window.startDominic?.();
			} catch (err) {
				if (cancelled) return;
				const area = document.getElementById("content");
				if (area) area.innerHTML = `<div class="err">Không khởi động được ứng dụng: ${err instanceof Error ? err.message : String(err)}</div>`;
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "dominic-host",
		dangerouslySetInnerHTML: { __html: markup_default }
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DominicApp, {});
}
//#endregion
export { Home as component };
