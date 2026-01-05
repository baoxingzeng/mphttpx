Step 1:
    npm install

Step 2:
    npm run build

Step 3:
    npm run test

mini-program (uniapp-test)
    Step 4:
        node tests/mock-server.js

    Step 5:
        edit tests/utils.js    
        change the config.api_prefix to your local ip address.

    Step 6: (optional)
        edit node_modules/uvu/dist/index.mjs
        some mini programs do not have globalThis, so add the following two lines to the beginning of the line:
            const globalThis = this || {};
            const UVU_QUEUE = globalThis.UVU_QUEUE || [];

    Step 7:
        cd tests/uniapp-test
        Follow the link below to launch the mini program to the target platform first.
        https://en.uniapp.dcloud.io/quickstart-cli.html#run-and-release-uni-app

    Step 8:
        does not verify valid domain names, web-view (business domain names), TLS versions and HTTPS certificates.
