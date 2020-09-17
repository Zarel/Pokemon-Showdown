 CREATE TABLE IF NOT EXISTS modlog (
    modlog_id INTEGER NOT NULL PRIMARY KEY,
    -- UNIX timestamp
    timestamp INTEGER NOT NULL,
    --- roomid OR global-roomid
    roomid TEXT NOT NULL,
    action TEXT NOT NULL,
    visual_roomid TEXT,
    action_taker_userid TEXT,
    userid TEXT,
    autoconfirmed_userid TEXT,
    ip TEXT,
    note TEXT
);

CREATE TABLE IF NOT EXISTS alts (
    modlog_id INTEGER NOT NULL,
    userid TEXT NOT NULL,
    PRIMARY KEY (modlog_id, userid),
    FOREIGN KEY (modlog_id) REFERENCES modlog(modlog_id)
);

CREATE INDEX IF NOT EXISTS ml_index_1 ON modlog(timestamp);
CREATE INDEX IF NOT EXISTS ml_index_2 ON modlog(roomid, userid, autoconfirmed_userid, timestamp);
CREATE INDEX IF NOT EXISTS ml_index_3 ON modlog(roomid, ip, timestamp);
CREATE INDEX IF NOT EXISTS ml_index_4 ON modlog(roomid, note, timestamp);
CREATE INDEX IF NOT EXISTS ml_index_5 ON modlog(roomid, action_taker_userid, timestamp);

PRAGMA journal_mode=WAL;
