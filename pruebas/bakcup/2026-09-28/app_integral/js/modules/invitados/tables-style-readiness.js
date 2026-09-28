export const TABLES_FINAL_STYLE_VERSION = '20260819-empty-onboarding1';

const STATUS_KEY = 'mgdTablesStyleStatus';
const BOUND_KEY = 'mgdTablesStyleBound';

function stylesheetIsParsed(link) {
  if (!link?.sheet) return false;
  try {
    return Boolean(link.sheet.cssRules);
  } catch (_) {
    return false;
  }
}

export function trackTablesFinalStyle(link) {
  if (!link) return null;
  if (link.dataset[BOUND_KEY] !== TABLES_FINAL_STYLE_VERSION) {
    link.dataset[BOUND_KEY] = TABLES_FINAL_STYLE_VERSION;
    link.addEventListener('load', () => {
      link.dataset[STATUS_KEY] = 'loaded';
    });
    link.addEventListener('error', () => {
      link.dataset[STATUS_KEY] = 'error';
    });
  }
  if (stylesheetIsParsed(link)) link.dataset[STATUS_KEY] = 'loaded';
  else if (!link.dataset[STATUS_KEY]) link.dataset[STATUS_KEY] = 'loading';
  return link;
}

export function setTablesFinalStyleHref(link, href) {
  trackTablesFinalStyle(link);
  if (link.href !== href) {
    link.dataset[STATUS_KEY] = 'loading';
    link.href = href;
  }
  return link;
}

export function tablesFinalStyleState(link) {
  trackTablesFinalStyle(link);
  return link?.dataset?.[STATUS_KEY] || 'missing';
}

export function tablesFinalStyleReady(link) {
  return tablesFinalStyleState(link) === 'loaded' && stylesheetIsParsed(link);
}
