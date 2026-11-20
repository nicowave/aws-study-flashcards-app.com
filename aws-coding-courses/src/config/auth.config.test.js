// The session cookie's domain follows the address the page was opened on, so
// one build serves both aws-study-flashcards-app.com and levelupstudyhub.com.
// auth.config.js is the same file in all six apps; this test covers the copy here.
import { describe, expect, it } from 'vitest';
import { cookieDomainFor } from './auth.config';

describe('cookieDomainFor', () => {
  it('uses the new name for the new name and its subdomains', () => {
    for (const host of ['levelupstudyhub.com', 'cloud.levelupstudyhub.com', 'typescript.levelupstudyhub.com', 'www.levelupstudyhub.com']) {
      expect(cookieDomainFor(host)).toBe('.levelupstudyhub.com');
    }
  });

  it('keeps the old name for the old name and its subdomains', () => {
    for (const host of ['aws-study-flashcards-app.com', 'cloud.aws-study-flashcards-app.com', 'bash.aws-study-flashcards-app.com']) {
      expect(cookieDomainFor(host)).toBe('.aws-study-flashcards-app.com');
    }
  });

  it('ignores letter case', () => {
    expect(cookieDomainFor('Cloud.LevelUpStudyHub.com')).toBe('.levelupstudyhub.com');
    expect(cookieDomainFor('CLOUD.AWS-STUDY-FLASHCARDS-APP.COM')).toBe('.aws-study-flashcards-app.com');
  });

  it('keeps a name ending in a dot host-only (the browser refuses the root domain there)', () => {
    expect(cookieDomainFor('levelupstudyhub.com.')).toBeNull();
    expect(cookieDomainFor('cloud.aws-study-flashcards-app.com.')).toBeNull();
  });

  it('gives no domain (a host-only cookie) to any other host', () => {
    for (const host of [
      'd158vcjntjystn.cloudfront.net',
      'evil-levelupstudyhub.com', // not a subdomain, just a similar name
      'levelupstudyhub.com.evil.com',
      'notaws-study-flashcards-app.com',
      'localhost',
      '',
      undefined,
    ]) {
      expect(cookieDomainFor(host)).toBeNull();
    }
  });
});
