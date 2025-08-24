export interface FileData {
	name: string;
	size?: number;
	type?: string;
	data: ArrayBufferLike;
	lastModified?: Date;
}

export interface FileStorage {
	upload(file: FileData): Promise<void>;
	delete(fileName: string): void;
	getObjectUri(fileName: string): string;
}
