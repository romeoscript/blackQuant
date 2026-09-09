---
description: >-
  The published third-party reviews, with the scope each firm actually covered
  rather than a headline score.
---

# Audit reports

The full PDFs are published unedited at [`/audits`](https://github.com/Blackquant-labs) on the main site. This page summarises what each one covered.

{% hint style="warning" %}
**Read the scope, not the firm's name.** The most common way an audit page misleads is by naming a well-known firm and letting the reader assume the review covered the product they are about to use. The entries below state exactly what was reviewed.
{% endhint %}

## Upstream dependency reviews

These cover the on-chain components BlackQuant's contracts build on. They are audits of **those dependencies**, not of BlackQuant's own contracts.

### Trail of Bits — Kiln Lagoon Vault Diff Review

| | |
| --- | --- |
| **Reviewed** | Lagoon v0 vault protocol (ERC-7540), version 0.6.0 |
| **Target** | [hopperlabsxyz/lagoon-v0](https://github.com/hopperlabsxyz/lagoon-v0) |
| **Window** | 20–24 April 2026 · one engineer-week |
| **Published** | 11 May 2026 |
| **Findings** | 1 medium, 1 low |
| **Resolution** | Both resolved at fix review, 29 April 2026 |

A diff review of the v0.5.1-to-v0.6.0 upgrade: entry and exit fee arithmetic across the settlement, asynchronous claim and synchronous paths; the haircut mechanism for synchronous redemptions; the external sanctions-list oracle; whitelist and blacklist access modes; and the `VaultInit` delegatecall and storage layout.

Deployment scripts and off-chain infrastructure were **out of scope**.

### OpenZeppelin — Contracts v5.6 Audit

| | |
| --- | --- |
| **Reviewed** | OpenZeppelin Contracts library, v5.4.0 → v5.6.0-rc.1 |
| **Target** | [OpenZeppelin/openzeppelin-contracts](https://github.com/OpenZeppelin/openzeppelin-contracts) |
| **Window** | 26 January – 5 February 2026 |
| **Published** | 27 February 2026 |
| **Findings** | 0 critical, 0 high, 2 medium, 10 low, 5 notes |
| **Resolution** | 18 in total — 14 resolved, 2 partially resolved |

A diff audit of the Solidity library BlackQuant's contracts inherit from: access control and `AccessManager`, ERC-4337 and ERC-7579 account abstraction, the crosschain and bridge contracts, `Governor`, the proxy and upgradeability primitives, and the ERC-20/721/1155 token extensions.

## How to read an audit report

**Start with the scope section.** It states the exact commits and the codebase. A report on a dependency says nothing about the code written on top of it.

**Check the window.** A one-engineer-week review and a three-month engagement are different levels of assurance, and both are called "an audit".

**Check what was excluded.** Deployment scripts, off-chain infrastructure and operational security are commonly out of scope, and are commonly where problems live.

**Check the fix review.** Findings identified is a different claim from findings resolved. Both audits above have a documented resolution status; many published reports do not.

{% hint style="info" %}
An audit is a **snapshot of specific commits over a fixed window**, by people who had a fixed number of days. It is evidence the code was examined carefully. It is not a proof of safety, and it does not extend to commits made afterwards.
{% endhint %}

## BlackQuant's own contracts

Source: [github.com/Blackquant-labs/blackquant-contract](https://github.com/Blackquant-labs/blackquant-contract)

Reviews specific to these contracts will be published on this page in the same format — scope, window, findings and resolution — when they are available.

## Related

* [The custody model](custody-model.md)
* [Reporting a vulnerability](reporting-a-vulnerability.md)
