# Interchain tokens using Hyperlane

This repo showcases a Hyperlane ERC20 and ERC721 tokens (HplERC20 and HplERC721). These tokens extend the base standards with an additional `transferRemote` function.

```mermaid
%%{init: {'theme':'base'}}%%
graph TB
    Alice((Alice))
    Operator((Operator))

    subgraph "Ethereum"
        HPL_E[(HPL)]
        O_E[/Outbox\]
    end

    subgraph "Polygon"
        HPL_P[(HPL)]
        EthereumInbox[\EthereumInbox/]
    end

    Bob((Bob))

    Alice -- "transferRemote(Polygon, Bob, 5)" --> HPL_E
    HPL_E -- "dispatch(Polygon, (Bob, 5))" --> O_E
    Operator -- "checkpoint()" --> O_E
    O_E-.->EthereumInbox
    Operator -- "relay()" --> EthereumInbox
    Operator -- "process(Ethereum, (Bob, 5))" --> EthereumInbox
    EthereumInbox-->|"handle(Ethereum, (Bob, 5))"|HPL_P
    HPL_P-.->Bob
```