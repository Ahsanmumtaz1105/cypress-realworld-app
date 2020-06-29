import express, { Application } from "express";
import path from "path";
import logger from "morgan";
import passport from "passport";
import session from "express-session";
import bodyParser from "body-parser";
import cors from "cors";
import paginate from "express-paginate";

import auth from "./auth";
import userRoutes from "./user-routes";
import contactRoutes from "./contact-routes";
import bankAccountRoutes from "./bankaccount-routes";
import transactionRoutes from "./transaction-routes";
import likeRoutes from "./like-routes";
import commentRoutes from "./comment-routes";
import notificationRoutes from "./notification-routes";
import bankTransferRoutes from "./banktransfer-routes";
import testDataRoutes from "./testdata-routes";

require("dotenv").config();

const corsOption = {
  origin: "http://localhost:3000",
  credentials: true,
};

const app = express();

/* istanbul ignore next */
// @ts-ignore
if (global.__coverage__) {
  require("@cypress/code-coverage/middleware/express")(app);
}

app.use(cors(corsOption));
app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
  session({
    secret: "session secret",
    resave: false,
    saveUninitialized: false,
    unset: "destroy",
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(paginate.middleware(+process.env.PAGINATION_PAGE_SIZE!));

app.use(auth);
console.log("after auth routes");
app.use("/users", userRoutes);
app.use("/contacts", contactRoutes);
app.use("/bankAccounts", bankAccountRoutes);
app.use("/transactions", transactionRoutes);
app.use("/likes", likeRoutes);
app.use("/comments", commentRoutes);
app.use("/notifications", notificationRoutes);
app.use("/bankTransfers", bankTransferRoutes);

/* istanbul ignore next */
if (process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development") {
  app.use("/testData", testDataRoutes);
}

console.log("before static route");

app.use(express.static(path.join(__dirname, "../public")));

function split(thing: any): string {
  if (typeof thing === "string") {
    return thing;
  } else if (thing.fast_slash) {
    return "";
  } else {
    var match = thing
      .toString()
      .replace("\\/?", "")
      .replace("(?=\\/|$)", "$")
      .match(/^\/\^((?:\\[.*+?^${}()|[\]\\\/]|[^.*+?^${}()|[\]\\\/])*)\$\//);
    return match ? match[1].replace(/\\(.)/g, "$1") : "<complex:" + thing.toString() + ">";
  }
}

function getRoutesOfLayer(path: string, layer: any): string[] {
  if (layer.method) {
    return [layer.method.toUpperCase() + " " + path];
  } else if (layer.route) {
    return getRoutesOfLayer(path + split(layer.route.path), layer.route.stack[0]);
  } else if (layer.name === "router" && layer.handle.stack) {
    let routes: string[] = [];

    layer.handle.stack.forEach(function (stackItem: any) {
      routes = routes.concat(getRoutesOfLayer(path + split(layer.regexp), stackItem));
    });

    return routes;
  }

  return [];
}

function getRoutes(app: Application): string[] {
  let routes: string[] = [];

  app._router.stack.forEach(function (layer: any) {
    routes = routes.concat(getRoutesOfLayer("", layer));
  });

  return routes;
}

const routes = getRoutes(app);
console.log("ROUTES", routes);

app.listen(3001);
