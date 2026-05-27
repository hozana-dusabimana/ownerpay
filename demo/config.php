<?php
// Demo config. In a real delivered project these two values are all you embed.
// LICENSE_URL can be overridden via env (used by the local smoke test before the repo is public).
return [
    'licenseUrl' => getenv('OWNERPAY_LICENSE_URL')
        ?: 'https://raw.githubusercontent.com/hozana-dusabimana/ownerpay/main/licenses/demo.jwt',
    // The OwnerPay PUBLIC key — safe to ship inside delivered source (verify-only).
    'publicKey' => <<<PEM
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsHDqhmagePez7jm/aG59
vqEnnBrgOkU/SkxNVL/KR6pSiTvCEEoW9W7B098XEi3RQ19BUnZ/wvKU17uZvFAn
G9GeOi99VPFVPERjx2mJ58QnSqFZP5R6iq7rB4V/EU/23eMfuMsXJWX9iYz1i5Xn
+tOS2I8oExfKTXHEMkmJqJaE2iPMLxPrT+gi5E0v0dvC6fZP1aIzlClVa6C399Hd
WYFVMnTw32PFBKNUNldrXKb4FXYUwf+namwQxj6nS0470eGEXdzVb6udw7ujg+S8
/HBVpcILsQPI+xb05cgetu70DZxi/o6iE7LXslAC9uAckgP5mRW1+/+lMdmlfhbd
vwIDAQAB
-----END PUBLIC KEY-----
PEM,
];
