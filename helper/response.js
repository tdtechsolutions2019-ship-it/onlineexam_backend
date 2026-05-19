export const sendResponse = (res, statusCode, message, data, isdelete) => {
  return res.status(statusCode).json({
    status: statusCode,
    message,
    ...(data !== undefined && { data }),
    ...(isdelete !== undefined && { canDelete: isdelete }),
  });
};
