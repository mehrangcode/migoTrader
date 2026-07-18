import { createServer } from "http";
import { createApp } from "./app";
import { appConfig } from "./config";
import { startCandleScheduler } from "./infrastructure/scheduler/candleScheduler";
import { XtProvider } from "./infrastructure/marketData/xtProvider";
import { EmailNotificationProvider } from "./infrastructure/notifications/emailNotificationProvider";
import { NotificationDispatcher } from "./infrastructure/notifications/notificationDispatcher";
import { SocketNotificationProvider } from "./infrastructure/notifications/socketNotificationProvider";
import { TelegramNotificationProvider } from "./infrastructure/notifications/telegramNotificationProvider";
import { SocketRealtimePublisher } from "./infrastructure/realtime/socketRealtimePublisher";
import { candleRepository, notificationChannelRepository, signalRepository } from "./infrastructure/repositories";
import { createSocketServer } from "./sockets/io";

const app = createApp();
const httpServer = createServer(app);
const io = createSocketServer(httpServer);

const marketDataProvider = new XtProvider(appConfig.marketData.baseUrl);

const notificationDispatcher = new NotificationDispatcher(
  new SocketNotificationProvider(io),
  {
    EMAIL: new EmailNotificationProvider(),
    TELEGRAM: new TelegramNotificationProvider(),
  },
  notificationChannelRepository,
);

startCandleScheduler(marketDataProvider, {
  candleRepository,
  signalRepository,
  notificationDispatcher,
  realtimePublisher: new SocketRealtimePublisher(io),
});

httpServer.listen(appConfig.port, () => {
  console.log(`Server listening on port ${appConfig.port} (${appConfig.nodeEnv})`);
});
