

const rows = document.querySelectorAll('.ember-view > tbody > tr');





rows.forEach


//want to autocomplete this : 
// function that open lines 

(async function () {
  const title = document.querySelector('h3[style*="--base-line-clamp-line-height: 25px"][style*="--lineHeight: 25px;"]').textContent;

  let totalLinks = getLinks();
  window.scrollTo(0, document.body.scrollHeight);
  await new Promise(resolve => setTimeout(resolve, 5000));

  let newLinks = getLinks();

  while (mergeTablesFromLastDuplicate(totalLinks, newLinks).length > totalLinks.length) {
    totalLinks = mergeTablesFromLastDuplicate(totalLinks, newLinks);
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise(resolve => setTimeout(resolve, 5000));
    newLinks = getLinks();
  }

  if (totalLinks.length > 0) {
    const blob = new Blob([totalLinks.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = title + ".txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
})();