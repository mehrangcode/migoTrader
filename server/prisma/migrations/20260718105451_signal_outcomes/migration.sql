-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Signal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "indicator" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "stopLoss" REAL,
    "takeProfit" REAL,
    "outcome" TEXT NOT NULL DEFAULT 'PENDING',
    "resolvedAt" DATETIME,
    "reason" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Signal" ("createdAt", "direction", "id", "indicator", "price", "reason", "symbol", "timeframe") SELECT "createdAt", "direction", "id", "indicator", "price", "reason", "symbol", "timeframe" FROM "Signal";
DROP TABLE "Signal";
ALTER TABLE "new_Signal" RENAME TO "Signal";
CREATE INDEX "Signal_symbol_timeframe_createdAt_idx" ON "Signal"("symbol", "timeframe", "createdAt");
CREATE INDEX "Signal_outcome_idx" ON "Signal"("outcome");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
