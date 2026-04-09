"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.startNetworkSniffer = void 0;
const startNetworkSniffer = () => {
    console.log("[Network Sniffer] Engaging synthetic eBPF network hooks...");
    // Simulate monitoring active DNS requests and TCP outbound sockets
    setInterval(() => {
        // In a real environment, this would poll 'netstat' or use a WinDivert driver
        const r = Math.random();
        if (r < 0.02) {
            console.log("[🚫 NETWORK ALERT] Sub-process attempting outbound connection to known C2 server (104.24.11.2)!");
            console.log("[🚫 NETWORK ALERT] Intercepting socket and forcing TCP RST...");
        }
        else if (r > 0.02 && r < 0.04) {
            // Simulated Hacker triggering Canary Token out on the public internet
            console.log("[🦅 CANARY SYSTEM] Simulating public internet token exfiltration event...");
            Promise.resolve().then(() => __importStar(require('axios'))).then(axios => {
                axios.default.post('http://localhost:4000/api/canary-ping', {
                    token: "AKIAIOSFODNN7EXAMPLE",
                    sourceIp: "185.20.10.4"
                }).catch(() => { });
            });
        }
    }, 15000);
    console.log("[Network Sniffer] Outbound traffic monitoring active.");
};
exports.startNetworkSniffer = startNetworkSniffer;
