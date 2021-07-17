import * as http from 'http';
import * as https from 'https';
import {FS, FSPath} from './fs';
import * as Utils from './utils';
import * as pathModule from 'path';

type FileListener = (this: NetServer, req: http.IncomingMessage, response: http.ServerResponse, body: AnyObject) => any;

interface NetServerOptions {
	https?: https.ServerOptions;
	notFound?: string;
	server?: http.Server;
	default?: FileListener;
	port?: number;
}

export class ServerError extends Error {
	status: number;
	constructor(message: string, status = 404) {
		super(message);
		this.status = 404;
		Error.captureStackTrace(this, Error);
	}
}

export class NetServer {
	opts: NetServerOptions;
	dir: string;
	listeners: {[path: string]: {callback: FileListener, isDir?: boolean}};
	notFound: FSPath;
	constructor(dir: string, opts: NetServerOptions = {}) {
		this.dir = dir;
		this.opts = opts;
		this.listeners = {};
		this.notFound = opts.notFound ? FS(opts.notFound) : FS(`server/static/404.html`);
	}
	get(path: string, callback: FileListener, isDir = false) {
		this.listeners[path] = {callback, isDir};
	}
	getListener(path: string) {
		if (this.listeners[path]) return this.listeners[path];
		for (const k in this.listeners) {
			const listener = this.listeners[k];
			if (listener.isDir && k.startsWith(path)) {
				return listener;
			}
		}
	}
	serve(
		req: http.IncomingMessage,
		response: http.ServerResponse,
		errorCallback?: (this: NetServer, error: Error) => any,
	) {
		if (req.method !== 'GET') {
			response.writeHead(405, 'Invalid request type');
			return response.end();
		}
		let pathname = req.url || `/404.html`;
		if (!pathname.startsWith('/')) pathname = `/${pathname}`;
		const listener = this.getListener(pathname);
		const body: AnyObject = {};
		if (listener) {
			const [, args] = Utils.splitFirst(pathname, '?');
			if (args) {
				const parts = args.split('&');
				for (const part of parts) {
					const [name, data] = part.split('=');
					body[name] = data;
				}
			}
			void listener.callback.call(this, req, response, body);
		}

		try {
			(pathname as string | void) = this.checkPath(pathname);
			if (!pathname) {
				throw new Error(`Access denied`);
			}
			const path = FS(this.dir + pathname);
			if (!path.existsSync() || path.isDirectorySync()) {
				return response.end(this.notFound.readIfExistsSync());
			}
			response.writeHead(200);
			response.end(path.readSync());
		} catch (e) {
			if (e.message === 'Access denied') {
				response.writeHead(405, "Access denied");
				response.end();
				return;
			}
			response.writeHead(404);
			response.end();
			if (errorCallback) {
				return errorCallback.call(this, e);
			}
			throw new ServerError(`Error serving request: ${req.url} (${this.dir}) - ${e.message}`);
		}
	}
	serveFile(file: string, response: http.ServerResponse, opts: {code?: number, thisDir?: boolean} = {}) {
		if (opts.code) response.writeHead(opts.code);
		if (!FS(file).existsSync()) {
			return response.end(this.notFound.readIfExistsSync());
		}
		const filename = opts.thisDir ? this.dir + file : file;
		const content = FS(filename).readIfExistsSync();
		response.end(content);
	}
	checkPath(pathname: string) {
		const path = pathModule.basename(pathname);
		if (path.startsWith('.') || pathname.includes('..')) return;
		return path;
	}
}
