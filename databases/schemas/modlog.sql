CREATE TABLE modlog (
    modlog_id INTEGER NOT NULL PRIMARY KEY,
    -- UNIX timestamp
    timestamp INTEGER NOT NULL,
    --- roomid OR global-roomid
    roomid TEXT NOT NULL,
    action TEXT NOT NULL,
    visual_roomid TEXT NOT NULL,
    note TEXT NOT NULL,
    action_taker_userid TEXT,
    userid TEXT,
    autoconfirmed_userid TEXT,
    ip TEXT
);

CREATE TABLE alts (
    modlog_id INTEGER NOT NULL,
    userid TEXT NOT NULL,
    PRIMARY KEY (modlog_id, userid),
    FOREIGN KEY (modlog_id) REFERENCES modlog(modlog_id)
) WITHOUT ROWID;

CREATE INDEX room_index ON modlog(roomid, timestamp);
CREATE INDEX all_fields_index ON modlog(roomid, action, userid, autoconfirmed_userid, action_taker_userid, ip, note, timestamp);
CREATE INDEX userid_index ON modlog(roomid, userid, autoconfirmed_userid, timestamp);
CREATE INDEX ip_index ON modlog(roomid, ip, timestamp);
CREATE INDEX note_index ON modlog(roomid, note, timestamp);
CREATE INDEX action_taker_index ON modlog(roomid, action_taker_userid, timestamp);
