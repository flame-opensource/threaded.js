fetch('https://raw.githubusercontent.com/flame-opensource/threaded.js/main/README.md')
    .then(res => res.text())
    .then(markdown => {
        const renderer = new marked.Renderer();
        renderer.heading = function (text) {
            const id = slugify(text.raw);
            return `<h${text.depth} id="${id}">${text.text}</h${text.depth}>`;
        };

        const html = marked.parse(markdown, { renderer });
        document.body.innerHTML = DOMPurify.sanitize(html);
        hljs.highlightAll();

        if (location.hash) {
          const id = location.hash.slice(1);
          requestAnimationFrame(() => {
            const el = document.getElementById(id);
            if (el) el.scrollIntoView({ behavior: "smooth" });
          });
        }
    })
    .catch(err => {
        document.body.innerHTML = '<p style="color:red">Failed to load README.md from threaded.js</p>';
    });

function slugify(text) {
  try {
    return String(text?.toString?.() ?? text)
      .toLowerCase()
      .replace(/[^\w]+/g, '-')
      .replace(/^-+|-+$/g, '');
  } catch (e) {
    return '';
  }
}