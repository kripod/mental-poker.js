import BigInt from 'bn.js';
import Bet from './bet';
import Card from './card';
import Config from './config';
import BetType from './enums/bet-type';
import * as Utils from './utils';
import type { PlayerJSON, Point, PointJSON } from './interfaces';

/**
 * A mutable object which represents a player of a game.
 * @class Player
 */
export default class Player {
  /**
   * Public key of the player.
   */
  publicKey: string;

  /**
   * Points generated by the player.
   */
  points: Point[] = [];

  /**
   * Secrets of the player. Must be kept hidden from others until the end of the
   * game and shall not be modified directly.
   */
  secrets: BigInt[] = new Array(Config.cardsInDeck + 1);

  /**
   * Secret hashes of the player. Used for secret verification at the end of the
   * game.
   */
  secretHashes: string[] = [];

  /**
   * Bets made by the player.
   */
  bets: Bet[] = [];

  /**
   * List of cards which are in the hand of the player.
   */
  cardsInHand: Card[] = [];

  /**
   * @param {?Object} params Parameters to be assigned to the new instance.
   */
  constructor(params: ?Object) {
    Object.assign(this, params);

    // Force setting `secretHashes` if all the secrets are known
    if (this.secretHashes.length === 0) {
      for (const secret of this.secrets) {
        if (!secret) return;
      }

      this.secretHashes = this.secrets.map((secret: BigInt): string =>
        Utils.getSecretHash(secret)
      );
    }
  }

  /**
   * Returns true whether the player has folded.
   * @returns {boolean}
   */
  get hasFolded(): boolean {
    if (this.bets.length === 0) return false;

    return this.bets[this.bets.length - 1].type === BetType.FOLD;
  }

  /**
   * Adds and verifies a secret at the given index.
   * @param {number} index Index of the secret to be added.
   * @param {BigInt} secret Secret to be added.
   * @returns {boolean} False whether verification has failed, otherwise, true.
   */
  addSecret(index: number, secret: BigInt): boolean {
    // Avoid re-addition of secrets
    if (this.secrets[index]) return true;

    // Check whether the given secret satisfies its corresponding hash
    if (Utils.getSecretHash(secret) !== this.secretHashes[index]) {
      return false;
    }

    this.secrets[index] = secret;
    return true;
  }

  /**
   * Generates random points for the player.
   * @returns {Player}
   */
  generatePoints(): Player {
    this.points = Utils.getRandomPoints();
    return this;
  }

  /**
   * Generates random secrets and their corresponding hashes for the player.
   * @returns {Player}
   */
  generateSecrets(): Player {
    this.secrets = Utils.getRandomSecrets();
    this.secretHashes = this.secrets.map((secret: BigInt): string =>
      Utils.getSecretHash(secret)
    );
    return this;
  }

  toJSON(): PlayerJSON {
    return Object.assign(
      {},
      this.publicKey && { publicKey: this.publicKey },
      this.points.length > 0 && {
        points: this.points.map((point: Point): PointJSON =>
          Utils.pointToJSON(point),
        ),
      },
      this.secretHashes.length > 0 && { secretHashes: this.secretHashes },
    );
  }
}
