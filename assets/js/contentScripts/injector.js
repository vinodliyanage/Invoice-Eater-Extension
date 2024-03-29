(() => {
  chrome.runtime.onMessage.addListener(function (
    request,
    sender,
    sendResponse
  ) {
    sendResponse(true);
    if (
      !sender.tab &&
      request.command === "startScript" &&
      request.name === "DROPSHIPPING_TOOL_INVOICY"
    ) {
      injector(getOrderQueue());
    }
  });

  function injector(orderElementObjectArray) {
    if (!(orderElementObjectArray && orderElementObjectArray.length)) return;

    function injectInvoiceNumber(orderId, orderIndex) {
      const INVOICE_INPUT_ID = `order(${orderIndex}).invoicenumber`;

      const inputInvoice = document.getElementById(INVOICE_INPUT_ID);
      if (!(inputInvoice && inputInvoice instanceof HTMLElement)) return;
      inputInvoice.value = (orderId || "").trim();
      inputInvoice.dispatchEvent(new Event("change"));
    }

    function injectQuantities(element, orderIndex) {
      function inject(rowElem) {
        if (!(rowElem && rowElem instanceof HTMLElement)) return;

        let isElementFound = false;

        const findElementUsingItemId = (rowElem) => {
          const inputArray = Array.from(
            rowElem.querySelectorAll("td input[name]") || []
          );
          let itemId = null;

          if (inputArray.length) {
            inputArray.forEach((inputElm) => {
              if (!(inputElm && inputElm instanceof HTMLElement)) return;
              const re = /(?:.+?)\.(?:item\((\d+)\))?/gim;
              const itemIdArr = Array.from(re.exec(inputElm.name) || []);
              if (itemIdArr && itemIdArr.length > 1) {
                itemId = itemIdArr[1];
                return;
              }
            });
          }
          if (!itemId) return;

          const INVOICE_QUANTITY_ID = `order(${orderIndex}).item(${itemId}).invoiced`;
          const inputQuantity = document.getElementById(INVOICE_QUANTITY_ID);

          if (!(inputQuantity && inputQuantity instanceof HTMLElement)) return;

          let qty =
            inputQuantity?.parentElement?.previousElementSibling?.innerText;
          if (qty && qty.length) {
            isElementFound = true;
            qty = qty.trim();
            inputQuantity.value = qty;
            inputQuantity.dispatchEvent(new Event("change"));
          }
        };

        const findElementUsingStucture = (rowElem) => {
          if (!rowElem.hasChildNodes()) return;

          const lastElm = rowElem.lastElementChild;

          const inputQuantity = lastElm.querySelector("input[name]");
          let qty = lastElm?.previousElementSibling?.innerText;

          if (qty && qty.length) {
            qty = qty.trim();
            isElementFound = true;
            inputQuantity.value = qty;
            inputQuantity.dispatchEvent(new Event("change"));
          }
        };

        findElementUsingItemId(rowElem);

        if (!isElementFound) {
          findElementUsingStucture(rowElem);
        }
      }

      const trArray = Array.from(
        element.querySelectorAll("table.fw_widget_table tbody tr")
      );
      if (!(trArray && trArray.length > 1)) return;

      trArray.slice(1).forEach((elem) => {
        if (!(elem && elem instanceof HTMLElement)) return;
        inject(elem);
      });
    }

    orderElementObjectArray.forEach((elmObject) => {
      const { element, orderId, orderIndex } = elmObject;
      if (!(element && element instanceof HTMLElement)) return;

      if (element && orderId && orderIndex) {
        injectInvoiceNumber(orderId, orderIndex);
        injectQuantities(element, orderIndex);
      }
    });
  }

  function getOrderQueue() {
    const orderElementObjectArray = [];

    const orderForm = document.querySelector(
      'form[name="GeneralOrderRealmForm"][id="primaryForm"]'
    );
    if (!(orderForm && orderForm instanceof HTMLElement)) {
      return;
    }
    const orderElementArray = Array.from(
      orderForm.querySelectorAll(".fw_widget_windowtag") || []
    );

    orderElementArray.forEach((elm) => {
      if (!(elm && elm instanceof HTMLElement)) return;

      const orderIdElement = elm.querySelector(
        "div.fw_widget_windowtag_topbar div.framework_fiftyfifty_left_justify span.no_emphasis_label a.simple_link"
      );
      if (!(orderIdElement && orderIdElement instanceof HTMLElement)) {
        return;
      }

      let orderId = (orderIdElement.innerText || "").trim();
      if (!(orderId && orderId.length)) return;

      let orderIndex;
      try {
        const refIdFromPrevElement = (
          elm.previousElementSibling.value || ""
        ).trim();

        let refIdFromOrderElement = null;
        try {
          refIdFromOrderElement = (orderIdElement.href || "")
            .split("Hub_PO=")[1]
            .trim();
        } catch (e) {
          null;
        }

        if (refIdFromPrevElement && refIdFromPrevElement.length) {
          orderIndex = refIdFromPrevElement;
        } else if (refIdFromOrderElement && refIdFromOrderElement.length) {
          orderIndex = refIdFromOrderElement;
        } else return;
      } catch (e) {
        null;
      }

      if (!(orderIndex && orderIndex.length)) return;

      try {
        orderId = orderId.trim();
        orderIndex = orderIndex.trim();
      } catch (e) {
        return;
      }

      if (orderId.length) {
        orderElementObjectArray.push({
          element: elm,
          orderId,
          orderIndex,
        });
      }
    });
    return orderElementObjectArray;
  }

  return true;
})();
