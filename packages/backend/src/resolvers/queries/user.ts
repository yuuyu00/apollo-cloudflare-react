import { QueryResolvers } from "../../gqlTypes";
import { requireAuth } from "../../auth";

export const users: QueryResolvers["users"] = async (
  _parent,
  _args,
  { services }
) => {
  return services.user.getUsers();
};

export const user: QueryResolvers["user"] = async (
  _parent,
  { id },
  { services }
) => {
  return services.user.getUser(id);
};

export const me: QueryResolvers["me"] = async (_parent, _args, context) => {
  const authUser = requireAuth(context.user);

  return context.services.user.getUser(authUser.userId);
};
