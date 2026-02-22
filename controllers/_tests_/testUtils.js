export const buildReq = (overrides = {}) => ({
  params: {},
  body: {},
  fields: {},
  files: {},
  ...overrides,
});

export const buildRes = () => ({
  status: jest.fn().mockReturnThis(),
  send: jest.fn(),
  json: jest.fn(),
});

export const expectStatusBeforeSend = (res) => {
  expect(res.status).toHaveBeenCalled();
  expect(res.send).toHaveBeenCalled();

  const statusOrder = res.status.mock.invocationCallOrder[0];
  const sendOrder = res.send.mock.invocationCallOrder[0];
  expect(statusOrder).toBeLessThan(sendOrder);
};