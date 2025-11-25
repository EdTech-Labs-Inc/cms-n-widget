import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { widgetRouter } from '@repo/widget-api';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: widgetRouter,
    createContext: () => ({}),
  });

export { handler as GET, handler as POST };
