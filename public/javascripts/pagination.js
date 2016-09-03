// created by bilalakil
// https://github.com/bilalakil/bin
jQuery(function($) {
    /*
     * The `options` argument is an object (i.e. `{}`)
     * which should have values specified for the following properties:
     *
     *     { // The values provided for each property are just examples!
     *         itemSelector: "#content tbody tr"
     *       , paginatorSelector: "#pagination"
     *       , itemsPerPage: 2
     *     }
     */
    function paginate(options) {
        // Notice that this function has exactly the same logic as the basic example,
        // but with some hardcoded values replaced by properties in `options`.
        var items = $(options.itemSelector);
        var numItems = items.length;
        var perPage = options.itemsPerPage;
        // only show the first 2 (or "first per_page") items initially
        items.slice(perPage).hide();
        // now setup pagination
        $(options.paginationSelector).pagination({
            items: numItems,
            itemsOnPage: perPage,
            cssStyle: "light-theme",
            onPageClick: function(pageNumber) { // this is where the magic happens
                // someone changed page, lets hide/show trs appropriately
                var showFrom = perPage * (pageNumber - 1);
                var showTo = showFrom + perPage;
                items.hide() // first hide everything, then show for the new page
                     .slice(showFrom, showTo).show();
                // By returning false in this function we prevent the plugin from changing the page fragment
                // (i.e. the "#page-3" added to your page URL).
                // This is desirable when there are multiple paginators on the page,
                // as that fragment on its own can't distinguish which paginator is being referred to.
                return false;
            }
        });
    }
    paginate({
        itemSelector: "#content-1 tbody tr"
      , paginationSelector: "#pagination-1"
      , itemsPerPage: 2
    });
    paginate({
        itemSelector: "#content-2 tbody tr"
      , paginationSelector: "#pagination-2"
      , itemsPerPage: 3
    });
});
