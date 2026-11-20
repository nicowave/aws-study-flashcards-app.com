// The session cookie's domain follows the address the page was opened on, so
// one build serves both aws-study-flashcards-app.com and levelupstudyhub.com.
// auth.config.js is the same file in all six apps; this test covers the copy here.
import { describe, expect, it } from 'vitest';
import { cookieDomainFor, onThisName, isStudyHubAddress } from './auth.config';

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
      'd111111abcdef8.cloudfront.net',
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

// Links between the sites follow the page's name, because each name keeps its own sign-in.
describe('onThisName', () => {
  const NEW = 'cloud.levelupstudyhub.com';
  const OLD = 'cloud.aws-study-flashcards-app.com';

  it('moves a Study Hub link onto the new name when the page is on the new name', () => {
    expect(onThisName('https://aws-study-flashcards-app.com', NEW)).toBe('https://levelupstudyhub.com');
    expect(onThisName('https://architect.aws-study-flashcards-app.com', 'levelupstudyhub.com')).toBe('https://architect.levelupstudyhub.com');
    for (const sub of ['cloud', 'ai', 'architect', 'developer', 'bash', 'python', 'js', 'typescript', 'tutorials']) {
      expect(onThisName(`https://${sub}.aws-study-flashcards-app.com`, NEW)).toBe(`https://${sub}.levelupstudyhub.com`);
    }
  });

  it('keeps the path, the part after "?" and the part after "#"', () => {
    expect(onThisName('https://aws-study-flashcards-app.com/terms.html', NEW)).toBe('https://levelupstudyhub.com/terms.html');
    expect(onThisName('https://cloud.aws-study-flashcards-app.com/?utm_source=readiness&x=1#plan', NEW))
      .toBe('https://cloud.levelupstudyhub.com/?utm_source=readiness&x=1#plan');
    expect(onThisName('https://aws-study-flashcards-app.com#pricing', NEW)).toBe('https://levelupstudyhub.com#pricing');
  });

  it('leaves every link exactly as written on the old name', () => {
    for (const url of [
      'https://aws-study-flashcards-app.com',
      'https://cloud.aws-study-flashcards-app.com',
      'https://aws-study-flashcards-app.com/privacy.html',
      'https://js.aws-study-flashcards-app.com/?a=b#c',
    ]) {
      expect(onThisName(url, OLD)).toBe(url);
      expect(onThisName(url, 'aws-study-flashcards-app.com')).toBe(url);
    }
  });

  it('leaves links alone on any other host (local copies, previews)', () => {
    for (const host of ['localhost', '127.0.0.1', 'd111111abcdef8.cloudfront.net', 'levelupstudyhub.com.', '', undefined]) {
      expect(onThisName('https://cloud.aws-study-flashcards-app.com', host)).toBe('https://cloud.aws-study-flashcards-app.com');
    }
  });

  it('never moves the sign-in address or a site that has no door under the new name', () => {
    for (const url of [
      'https://auth.aws-study-flashcards-app.com/oauth2/authorize',
      'https://sysops.aws-study-flashcards-app.com',
      'https://www.aws-study-flashcards-app.com',
      'https://javascript.aws-study-flashcards-app.com',
    ]) {
      expect(onThisName(url, NEW)).toBe(url);
    }
  });

  it('leaves look-alike and foreign addresses alone', () => {
    for (const url of [
      'https://aws-study-flashcards-app.com.evil.com/',
      'https://evil-aws-study-flashcards-app.com',
      'https://aws-study-flashcards-app.com@evil.com/',
      'https://aws-study-flashcards-app.com:8443/',
      'https://a.b.aws-study-flashcards-app.com',
      'http://aws-study-flashcards-app.com',
      'https://github.com',
      '/relative/path',
      '#tutorials',
    ]) {
      expect(onThisName(url, NEW)).toBe(url);
    }
    expect(onThisName(undefined, NEW)).toBeUndefined();
  });

  it('ignores letter case in the written link', () => {
    expect(onThisName('https://Cloud.AWS-Study-Flashcards-App.com/Path', NEW)).toBe('https://cloud.levelupstudyhub.com/Path');
  });

  it('reads the page address when no host is given', () => {
    // Tests run without a browser window (vitest's node environment), so there is no page address and links stay as written.
    expect(onThisName('https://cloud.aws-study-flashcards-app.com')).toBe('https://cloud.aws-study-flashcards-app.com');
  });
});

describe('isStudyHubAddress', () => {
  it('knows both names and their subdomains', () => {
    for (const url of ['https://levelupstudyhub.com/', 'https://cloud.levelupstudyhub.com/x', 'https://aws-study-flashcards-app.com/', 'https://js.aws-study-flashcards-app.com/']) {
      expect(isStudyHubAddress(url)).toBe(true);
    }
  });

  it('treats every other address as outside, including look-alikes and junk', () => {
    for (const url of ['https://www.google.com/search?q=aws-study-flashcards-app.com', 'https://levelupstudyhub.com.evil.com/', 'https://notaws-study-flashcards-app.com/', '', 'not a url', undefined]) {
      expect(isStudyHubAddress(url)).toBe(false);
    }
  });
});
