---
section: contributors
---
- On Windows, whole numbers above 2^31 (step hashes, for one) reach JSON
  intact from Lua 5.1 in the tools and the test client: Lua 5.1 there formats
  `%d` through a 32-bit long. A pack update test and the Ashenvale walk test
  failed on Windows because of it.
