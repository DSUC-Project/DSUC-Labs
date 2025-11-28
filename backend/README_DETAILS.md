Additional backend details

- To run seed script:
  - npx ts-node scripts/seed.ts

- To upload avatar via curl (example):
  curl -X POST -F "file=@/path/to/avatar.png" http://localhost:4000/api/members/<id>/avatar

- To submit finance with file via curl:
  curl -X POST -F "file=@/path/to/bill.png" -F "requester_id=<id>" -F "amount=100" http://localhost:4000/api/finance/request

- Postman: open `postman_collection.json` and set `baseUrl` variable to `http://localhost:4000`.
