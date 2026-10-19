---
section: contributors
---
- Buying for buy goals reads the merchant's goods through
  `C_MerchantFrame.GetItemInfo` where the client has it, with
  `GetMerchantItemInfo` as the fallback. Forever has both today, but the old
  call is missing from the client's API lists and was the one client call
  Polestar made without a check (thanks RamosJoaquim, who found it while
  testing Polestar on another client, #153).
