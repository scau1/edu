const axios = require('axios');
const cheerio = require('cheerio');

async function crawlNaverBlog(query, page = 1) {
  const url = 'https://search.naver.com/search.naver';
  const params = {
    where: 'blog',
    sm: 'tab_jum',
    query: query,
    start: (page - 1) * 10 + 1
  };

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    Referer: 'https://search.naver.com/'
  };

  try {
    const res = await axios.get(url, {
      params,
      headers,
      timeout: 20000
    });

    const $ = cheerio.load(res.data);

    const results = [];

    // 네이버 블로그 검색 결과 링크/제목
    $('a.sh_blog_title, a.total_tit, a.title_link').each((i, el) => {
      const title = $(el).text().trim();
      let href = $(el).attr('href');

      if (!title || !href) return;

      href = normalizeLink(href);

      results.push({
        title,
        link: href
      });
    });

    // 중복 제거
    const unique = [];
    const seen = new Set();
    for (const item of results) {
      if (!seen.has(item.link)) {
        seen.add(item.link);
        unique.push(item);
      }
    }

    return unique.slice(0, 10);
  } catch (error) {
    console.error('크롤링 오류:', error.message);
    return [];
  }
}

function normalizeLink(href) {
  if (!href) return '';

  try {
    const parsed = new URL(href, 'https://search.naver.com');
    const u = parsed.searchParams.get('u');
    const url = parsed.searchParams.get('url');

    if (u) return decodeURIComponent(u);
    if (url) return decodeURIComponent(url);

    return parsed.href;
  } catch (e) {
    return href;
  }
}

(async () => {
  const query = '파이썬';
  const items = await crawlNaverBlog(query, 1);

  console.log(`검색어: ${query}`);
  console.log('검색 결과 수:', items.length);

  items.forEach((item, index) => {
    console.log(`${index + 1}. ${item.title}`);
    console.log(item.link);
    console.log('---');
  });
})();
