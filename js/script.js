window.addEventListener("DOMContentLoaded", function() {
  const html            = document.querySelector("html");
  const navBtn          = document.querySelector(".navbar-btn");
  const navList         = document.querySelector(".navbar-list");
  const backToTopFixed  = document.querySelector(".back-to-top-fixed");
  let lastTop           = 0;
  let lastRefreshTime   = 0;
  let frameCount        = 0;
  let refreshRate       = 0;
  let theme             = window.localStorage.getItem('theme') || '';

  theme && html.classList.add(theme)

  // ** 新增部分：加载 Notice API 并使用 LocalStorage 缓存数据 **
  const noticeElement = document.querySelector("#notice"); // 查找通知的 DOM 元素
  const cacheKey = 'noticeContent';
  const cacheExpiryKey = 'noticeCacheExpiry';
  const cacheDuration = 1000 * 60 * 10; // 10 分钟缓存时间
  const now = Date.now();

  if (noticeElement) { // 确保通知区域存在
      const cachedNotice = localStorage.getItem(cacheKey);
      const cacheExpiry = localStorage.getItem(cacheExpiryKey);

      if (cachedNotice && cacheExpiry && now < cacheExpiry) {
          // 使用缓存的数据
          noticeElement.textContent = cachedNotice;
      } else {
          // 请求新的 Notice 数据并缓存
          fetch('https://v1.hitokoto.cn/?c=b&encode=text')
              .then(response => {
                  if (!response.ok) {
                      throw new Error(`HTTP error! Status: ${response.status}`);
                  }
                  return response.text();
              })
              .then(data => {
                  noticeElement.textContent = data;
                  // 缓存数据和过期时间
                  localStorage.setItem(cacheKey, data);
                  localStorage.setItem(cacheExpiryKey, now + cacheDuration);
              })
              .catch(error => {
                  noticeElement.textContent = `无法获取链接内容：${error.message}`;
              });
      }
  }
  // ** 新增部分结束 **

  /**
   * 初始化刷新率估计
   */
  const estimateRefreshRate = () => {
      const currentTime = performance.now();
      if (currentTime - lastRefreshTime >= 1000) { // fps
          refreshRate = frameCount;
          frameCount = 0;
          lastRefreshTime = currentTime;
      } else {
          frameCount++;
      }
      requestAnimationFrame(estimateRefreshRate);
  }
  
  estimateRefreshRate();

  const goScrollTop = () => {
    let currentTop = getScrollTop()
    let speed = Math.floor(-currentTop / (refreshRate / 6))
    if (currentTop > lastTop + 0.5 || currentTop < lastTop - 0.5 ) {
      // interrupt the animation
      return lastTop = 0
    }
    let distance = currentTop + speed;
    lastTop = distance;
    document.documentElement.scrollTop = distance;
    distance > 0 && window.requestAnimationFrame(goScrollTop)
  }

  const toggleBackToTopBtn = (top) => {
    top = top || getScrollTop()
    if (top >= 100) {
      backToTopFixed.classList.add("show")
    } else {
      backToTopFixed.classList.remove("show")
    }
  }

  toggleBackToTopBtn()

  // theme light click
  document.querySelector('#theme-light').addEventListener('click', function () {
    html.classList.remove('theme-dark')
    html.classList.add('theme-light')
    window.localStorage.setItem('theme', 'theme-light')
  })

  // theme dark click
  document.querySelector('#theme-dark').addEventListener('click', function () {
    html.classList.remove('theme-light')
    html.classList.add('theme-dark')
    window.localStorage.setItem('theme', 'theme-dark')
  })

  // theme auto click
  document.querySelector('#theme-auto').addEventListener('click', function() {
    html.classList.remove('theme-light')
    html.classList.remove('theme-dark')
    window.localStorage.setItem('theme', '')
  })

  // mobile nav click
  navBtn.addEventListener("click", function () {
    html.classList.toggle("show-mobile-nav");
    this.classList.toggle("active");
  });

  // mobile nav link click
  navList.addEventListener("click", function (e) {
    if (e.target.nodeName == "A" && html.classList.contains("show-mobile-nav")) {
      navBtn.click()
    }
  })

  // click back to top
  backToTopFixed.addEventListener("click", function () {
    lastTop = getScrollTop()
    goScrollTop()
  });

  window.addEventListener("scroll", function () {
    toggleBackToTopBtn()
  }, { passive: true });

  /** handle lazy bg iamge */
  handleLazyBG();
});

/**
 * 获取当前滚动条距离顶部高度
 *
 * @returns 距离高度
 */
function getScrollTop () {
  return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
}

function querySelectorArrs (selector) {
  return Array.from(document.querySelectorAll(selector))
}


function handleLazyBG () {
  const lazyBackgrounds = querySelectorArrs('[background-image-lazy]')
  let lazyBackgroundsCount = lazyBackgrounds.length
  if (lazyBackgroundsCount > 0) {
    let lazyBackgroundObserver = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function({ isIntersecting, target }) {
        if (isIntersecting) {
          let img = target.dataset.img
          if (img) {
            target.style.backgroundImage = `url(${img})`
          }
          lazyBackgroundObserver.unobserve(target)
          lazyBackgroundsCount --
        }
        if (lazyBackgroundsCount <= 0) {
          lazyBackgroundObserver.disconnect()
        }
      })
    })

    lazyBackgrounds.forEach(function(lazyBackground) {
      lazyBackgroundObserver.observe(lazyBackground)
    })
  }
}
