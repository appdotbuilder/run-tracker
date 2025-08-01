
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createUserInputSchema, 
  loginInputSchema,
  createActivityInputSchema,
  updateActivityInputSchema,
  getUserActivitiesInputSchema,
  likeActivityInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { loginUser } from './handlers/login_user';
import { createActivity } from './handlers/create_activity';
import { getUserActivities } from './handlers/get_user_activities';
import { getAllActivities } from './handlers/get_all_activities';
import { updateActivity } from './handlers/update_activity';
import { deleteActivity } from './handlers/delete_activity';
import { likeActivity } from './handlers/like_activity';
import { unlikeActivity } from './handlers/unlike_activity';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User authentication routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  loginUser: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => loginUser(input)),

  // Activity management routes
  createActivity: publicProcedure
    .input(createActivityInputSchema)
    .mutation(({ input }) => createActivity(input)),

  getUserActivities: publicProcedure
    .input(getUserActivitiesInputSchema)
    .query(({ input }) => getUserActivities(input)),

  getAllActivities: publicProcedure
    .input(z.object({ currentUserId: z.number().optional() }))
    .query(({ input }) => getAllActivities(input.currentUserId)),

  updateActivity: publicProcedure
    .input(updateActivityInputSchema)
    .mutation(({ input }) => updateActivity(input)),

  deleteActivity: publicProcedure
    .input(z.object({ id: z.number(), user_id: z.number() }))
    .mutation(({ input }) => deleteActivity(input)),

  // Activity likes routes
  likeActivity: publicProcedure
    .input(likeActivityInputSchema)
    .mutation(({ input }) => likeActivity(input)),

  unlikeActivity: publicProcedure
    .input(likeActivityInputSchema)
    .mutation(({ input }) => unlikeActivity(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
