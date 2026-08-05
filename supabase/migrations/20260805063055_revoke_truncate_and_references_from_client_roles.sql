/*
  # Remove residual destructive grants from the public client roles

  1. Problem
     After removing DELETE, the `anon` and `authenticated` roles still held
     TRUNCATE, REFERENCES and TRIGGER on all five tables (inherited from the
     original blanket `GRANT ALL`). TRUNCATE empties a table outright, and
     TRIGGER lets a role attach code to a table. None of these are used by the
     application and none should be reachable by a public role.

  2. Changes
     - Revoke TRUNCATE, REFERENCES and TRIGGER on all five tables from
       `anon` and `authenticated`.

  3. Security
     Closes the remaining destructive privileges on the data tables. SELECT
     stays intact everywhere, and the projects INSERT/UPDATE needed by the
     maintenance screen is untouched here. No data is modified.
*/

REVOKE TRUNCATE, REFERENCES, TRIGGER ON projects FROM anon, authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON work_orders FROM anon, authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON schedules FROM anon, authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON tracking_entries FROM anon, authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON specs FROM anon, authenticated;
