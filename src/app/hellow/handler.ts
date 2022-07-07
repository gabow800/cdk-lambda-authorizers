
export const handler = async (_event: any, _context: any, _callback: any) => {
  console.log('Hellow handler!!!');
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Hello world from API Gateway' }),
  };
};