var element = document.getElementById('paginationDiv');
let pages = parseInt(element.dataset.pages) || 0;
let page = parseInt(element.dataset.page) || 1;
let queryParam = element.dataset.query || '';
let target = element.dataset.href;

element.innerHTML = createPagination(pages, page);

function createPagination(pages, page) {
    let str = '<ul class="pagination">';
    let active;
    let pageCutLow = page - 1;
    let pageCutHigh = page + 1;
    
    // Helper function to build URL with query parameters
    function buildUrl(pageNum) {
        return target + pageNum + queryParam;
    }
    
    // Show the Previous button only if you are on a page other than the first
    if (page > 1) {
        str += '<li class="page-item previous no"><a class="page-link" href="' + buildUrl(page-1) + '">Previous</a></li>';
    }
    // Show all the pagination elements if there are less than 6 pages total
    if (pages < 6) {
        for (let p = 1; p <= pages; p++) {
            active = (page === p ? " active" : " no");
            str += '<li class="page-item '+active+'"><a class="page-link" href="' + buildUrl(p) + '">'+ p +'</a></li>';
        }
    }
    // Use "..." to collapse pages outside of a certain range
    else {
        // Show the very first page followed by a "..." at the beginning of the
        // pagination section (after the Previous button)
        if (page > 2) {
            str += '<li class="no page-item"><a class="page-link" href="' + buildUrl(1) + '">1</a></li>';
            if (page > 3) {
                str += '<li class="out-of-range"><span class="page-link">...</span></li>';
            }
        }
        // Determine how many pages to show after the current page index
        if (page === 1) {
            pageCutHigh += 2;
        } else if (page === 2) {
            pageCutHigh += 1;
        }
        // Determine how many pages to show before the current page index
        if (page === pages) {
            pageCutLow -= 2; //<changed here
        } else if (page === pages-1) {
            pageCutLow -= 1;
        }
        // Output the indexes for pages that fall inside the range of pageCutLow
        // and pageCutHigh
        for (let p = pageCutLow; p <= pageCutHigh; p++) {
            if (p === 0) {
                p += 1;
            }
            if (p > pages) {
                continue
            }
            active = page == p ? "active" : "no";
            str += '<li class="page-item '+active+'"><a class="page-link" href="' + buildUrl(p) + '">'+ p +'</a></li>';
        }
        // Show the very last page preceded by a "..." at the end of the pagination
        // section (before the Next button)
        if (pageCutHigh < pages) {
            // Only show ellipsis if there's a gap between the current range and the last page
            if (pageCutHigh < pages - 1) {
                str += '<li class="out-of-range"><span class="page-link">...</span></li>';
            }
            // Always show the last page if we're not already showing it in the range
            str += '<li class="page-item no"><a class="page-link" href="' + buildUrl(pages) + '">'+pages+'</a></li>';
        }
    }
    // Show the Next button only if you are on a page other than the last
    if (page < pages) {
        str += '<li class="page-item next no"><a class="page-link" href="' + buildUrl(page+1) + '">Next</a></li>';
    }
    str += '</ul>';
    // Return the pagination string to be outputted in the pug templates
    document.getElementById('paginationDiv').innerHTML = str;
    return str;
}

// text-black text-decoration-none