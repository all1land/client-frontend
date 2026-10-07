/**
 * 주어진 경로(path)로 라우팅하는 유틸리티 함수
 * @param {object} router Vue Router 인스턴스 (useRouter()의 반환 값)
 * @param {string} path 이동할 페이지 경로 (예: '/auth/sign-up', '/main')
 * @param {object} query 쿼리 파라미터 객체 (예: { id: 1, name: 'test' })
 */
export function navigateTo(router, path, query = null) {
  if (router && path) {
    const destination = query ? { path, query } : path;
    console.log(`[Router Util] Navigating to: ${path}`, query ? `with query: ${JSON.stringify(query)}` : '');
    router.push(destination);
  } else {
    console.error("[Router Util] Router 인스턴스 또는 경로(path)가 유효하지 않습니다.");
  }
}

/**
 * 이전에 방문한 페이지로 돌아가되 히스토리가 없으면 fallback 경로로 이동
 * @param {object} router Vue Router 인스턴스 (useRouter()의 반환 값)
 * @param {string|null} fallbackPath 히스토리가 없을 때 이동할 경로
 */
export function goBack(router, fallbackPath = null) {
  if (!router) {
    console.error("[Router Util] Router 인스턴스가 유효하지 않습니다.");
    return;
  }

  const hasHistory = typeof window !== 'undefined' && window.history.length > 1;
  if (hasHistory) {
    console.log('[Router Util] Going back to previous page');
    router.back();
    return;
  }

  if (fallbackPath) {
    console.log(`[Router Util] No history. Navigating to fallback: ${fallbackPath}`);
    router.push(fallbackPath);
    return;
  }

  console.warn('[Router Util] No history and no fallbackPath provided.');
}

/**
 * 앞으로 이동하는 유틸리티 함수
 * @param {object} router Vue Router 인스턴스 (useRouter()의 반환 값)
 */
export function goForward(router) {
  if (router) {
    console.log('[Router Util] Going forward to next page');
    router.forward();
  } else {
    console.error("[Router Util] Router 인스턴스가 유효하지 않습니다.");
  }
}

/**
 * 특정 단계만큼 히스토리를 이동하는 유틸리티 함수
 * @param {object} router Vue Router 인스턴스 (useRouter()의 반환 값)
 * @param {number} delta 이동할 단계 (음수: 뒤로, 양수: 앞으로)
 */
export function go(router, delta) {
  if (router && typeof delta === 'number') {
    console.log(`[Router Util] Moving ${delta > 0 ? 'forward' : 'back'} ${Math.abs(delta)} step(s)`);
    router.go(delta);
  } else {
    console.error("[Router Util] Router 인스턴스 또는 delta 값이 유효하지 않습니다.");
  }
}