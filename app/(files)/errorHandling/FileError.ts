class FileError extends Error {
  constructor(message: string, public httpStatus: number) {
    super(message);
  }
}

export { FileError };
