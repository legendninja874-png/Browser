import { Router, type IRouter } from "express";
import healthRouter      from "./health";
import tabsRouter        from "./tabs";
import workspacesRouter  from "./workspaces";
import bookmarksRouter   from "./bookmarks";
import historyRouter     from "./history";
import intelligenceRouter from "./intelligence";
import downloadsRouter   from "./downloads";
import dashboardRouter   from "./dashboard";
import syncRouter        from "./sync";
import proxyRouter       from "./proxy";

const router: IRouter = Router();

router.use(healthRouter);
router.use(tabsRouter);
router.use(workspacesRouter);
router.use(bookmarksRouter);
router.use(historyRouter);
router.use(intelligenceRouter);
router.use(downloadsRouter);
router.use(dashboardRouter);
router.use(syncRouter);
router.use(proxyRouter);

export default router;
