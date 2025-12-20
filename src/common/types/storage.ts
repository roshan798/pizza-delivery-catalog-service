export interface FileData {
	name: string;
	size?: number;
	type?: string;
	data: ArrayBufferLike;
	lastModified?: Date;
}
export interface CompressionOptions {
	quality?: number; // 0 to 1, image quality level
	maxWidth?: number; // max width in px
	maxHeight?: number; // max height in px
	format?: 'jpeg' | 'png' | 'webp'; // target format
}

export interface FileStorage {
	upload(file: FileData): Promise<void>;
	delete(fileName: string): Promise<void>;
	getObjectUri(fileName: string): string;
	compress(file: FileData, options?: CompressionOptions): Promise<Buffer>;
}
