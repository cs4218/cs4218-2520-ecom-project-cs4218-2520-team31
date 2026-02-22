export function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

export function silenceConsole() {
  const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  return () => {
    logSpy.mockRestore();
    errSpy.mockRestore();
  };
}
