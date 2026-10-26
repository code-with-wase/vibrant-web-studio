const { app, BrowserWindow, net, protocol, shell } = require("electron");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

protocol.registerSchemesAsPrivileged([
  {
    scheme: "dcstore",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);

const developmentUrl = "http://127.0.0.1:5173";

function registerRendererProtocol() {
  const distRoot = path.resolve(app.getAppPath(), "dist");

  protocol.handle("dcstore", (request) => {
    const url = new URL(request.url);
    if (url.hostname !== "app") {
      return new Response("Not found", { status: 404 });
    }

    let pathname;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      return new Response("Bad request", { status: 400 });
    }
    const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^[/\\]+/, "");
    const filePath = path.resolve(distRoot, relativePath);
    const relativeToRoot = path.relative(distRoot, filePath);
    if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
      return new Response("Forbidden", { status: 403 });
    }

    return net.fetch(pathToFileURL(filePath).toString());
  });
}

function createMainWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 960,
    minHeight: 640,
    autoHideMenuBar: true,
    icon: path.join(app.getAppPath(), "public", "favicon.ico"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });
  window.maximize();

  const rendererUrl = app.isPackaged ? "dcstore://app/" : developmentUrl;
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://") || url.startsWith("http://")) {
      void shell.openExternal(url);
    }
    return { action: "deny" };
  });
  window.webContents.on("will-navigate", (event, url) => {
    const allowed = app.isPackaged
      ? url.startsWith("dcstore://app/")
      : url.startsWith(developmentUrl);
    if (allowed) return;
    event.preventDefault();
    if (url.startsWith("https://") || url.startsWith("http://")) {
      void shell.openExternal(url);
    }
  });

  void window.loadURL(rendererUrl);
}

app.whenReady().then(() => {
  if (app.isPackaged) registerRendererProtocol();
  createMainWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
