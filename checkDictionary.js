const nounReplacement = [
  // OKREŚLENIA
  ["mężczyzna", "kobieta"],
  ["mężczyzna", "kobietka"],
  ["dziewczyna", "chłopak"],
  ["facet", "laska"],
  ["gościu", "dziewczyna"],
  ["koleś", "panienka"],
  ["typ", "dziewczyna"],
  ["typek", "dziewczyna"],
  ["pan", "pani"],
  ["gość", "kobita"],
  ["chłop", "baba"],
  ["gostek", "dziewczyna"],
  ["on", "ona"],
  ["kawaler", "panna"],
  ["mąż", "żona"],
  ["narzeczony", "narzeczona"],
  ["partner", "partnerka"],
  ["rozwodnik", "rozwódka"],
  ["przyjaciółka", "przyjaciel"],
  ["koleżanka", "kolega"],
  ["suka", "żigolo"],
  ["suczka", "żigolak"],
  ["prawiczek", "dziewica"],
  ["gej", "lesbijka"],
  ["sperma", "sok"],
  ["polak", "polka"],
  ["chłopiec", "dziewczynka"],
  ["wdowiec", "wdowa"],
  ["mężatka", "mąż"],
  // CZĘŚCI CIAŁA
  ["kapucyn", "wagina"],
  ["fiutek", "cipka"],
  ["członek", "pochwa"],
  ["fallus", "kuciapa"],
  ["kuśka", "piczka"],
  ["prącie", "wagina"],
  ["przyrodzenie", "srom"],
  ["ptaszek", "piczka"],
  ["członek", "wagina"],
  ["penis", "pochwa"],
  ["fiut", "cipa"],
  ["kutas", "cipa"],
  ["pała", "dziura"],
  ["penisek", "dziurka"],
  ["penisek", "cipeczka"],
  ["pierś", "jądro"],
  ["jajo", "cycek"],
  ["jajko", "cycek"],
  ["pierś", "jajeczko"],
  ["łechtaczka", "napletek"],
  ["muszelka", "penisek"],
  ["penisek", "myszka"],
  ["chuj", "pizda"],
  ["broda", "włosy"],
  ["koń", "pipa"],
  ["biust", "klata"],
  // PRZEDMIOTY
  ["bokserki", "stringi"],
  ["slipy", "figi"],
  ["sukienka", "koszulka"],
  ["adidasy", "szpilki"],
  ["spodnie", "rajstopy"],
  ["stanik", "majtki"],
  ["miseczka", "rozmiar"],
];

const adjectiveReplacement = [
  ["duży", "luźny"],
  ["mały", "ciasny"],
  ["żonaty", "zamężny"],
  ["kobiecy", "męski"],
  ["twardy", "mokry"],
];

const uniqueWords = [
  ["starszy", "stary"],
  ["starsza", "stara"],
];

const checkDictionary = async (word) => {
  const wordToReturn = word;
  const encodedSjp = encodeURIComponent(word);
  const fetchApiSjp = async () => {
    try {
      const fetchData = await axios.get(`https://sjp.pl/${encodedSjp}`);
      const sjpResponse = await fetchData.data;
      const domSjp = new JSDOM(sjpResponse);
      const domSjpTitle =
        domSjp.window.document.querySelector("title").textContent;
      if (domSjpTitle.includes("brak")) {
        // console.log(`Nie znaleziono bezokolicznika słowa ${word} :(`);
        return word;
      }

      const wordToSearch = () => {
        if (
          domSjp.window.document.querySelector("th").textContent === "starszy"
        ) {
          return "stary";
        } else return domSjp.window.document.querySelector("th").textContent;
      };
      // console.log("BEZOKOLICZNIK: " + wordToSearch());
      return await fetchApiWiki(word, wordToSearch());
    } catch {}
  };
  const fetchApiWiki = async (word, wikiWord) => {
    try {
      const encodedWiki = encodeURIComponent(wikiWord);
      const fetchData = await axios.get(
        `https://pl.wiktionary.org/wiki/${encodedWiki}`
      );
      // console.log("Przeszlo");
      const wikiResponse = await fetchData.data;
      const domWiki = new JSDOM(wikiResponse);
      const czescMowy =
        domWiki.window.document.querySelectorAll("i")[0].innerHTML;
      const wikiTable = domWiki.window.document.querySelectorAll("tbody tr");
      if (
        wikiTable.length === 0 ||
        (!czescMowy.includes("rzeczownik") &&
          !czescMowy.includes("przymiotnik") &&
          !czescMowy.includes("czasownik"))
      ) {
        // console.log(
        //   `Ten bezokolicznik (${word}) nie ma tabeli lub na nim nie pracujemy - zwracam go`
        // );
        return word;
      }
      // console.log(czescMowy);
      if (czescMowy.includes("rzeczownik")) {
        //SPRAWDZ LISTE RZECZOWNIKÓW DO PODMIANY
        for (let i = 0; i < nounReplacement.length; i++) {
          for (let j = 0; j < nounReplacement[i].length; j++) {
            if (nounReplacement[i][j] === wikiWord) {
              const foundEquivalent = nounReplacement[i].filter(
                (word) => word !== nounReplacement[i][j]
              )[0];
              for (let k = 1; k <= 7; k++) {
                for (let l = 1; l <= 2; l++) {
                  if (
                    parse(wikiTable[k].innerHTML).getElementsByTagName("td")[l]
                      .innerHTML === word
                  ) {
                    //JAK ZNAJDZIESZ ODPOWIEDNIĄ FORMĘ RZECZOWNIKA SZUKAJ FORMY EKWIWALENTU
                    const encodedWikiDepper =
                      encodeURIComponent(foundEquivalent);
                    const fetchData = await axios.get(
                      `https://pl.wiktionary.org/wiki/${encodedWikiDepper}`
                    );
                    const wikiResponseDeeper = await fetchData.data;
                    const domWikiDeeper = new JSDOM(wikiResponseDeeper);
                    const wikiTableDeeper =
                      domWikiDeeper.window.document.querySelectorAll(
                        "tbody tr"
                      );
                    if (wikiTableDeeper.length === 0) {
                      // console.log(`Ten bezokolicznik (${word}) nie ma tabeli`);
                      return word;
                    }

                    // console.log(
                    //   `The result is word ${
                    //     parse(
                    //       wikiTableDeeper[k].innerHTML
                    //     ).getElementsByTagName("td")[l].innerHTML
                    //   }!!`
                    // );
                    return parse(
                      wikiTableDeeper[k].innerHTML
                    ).getElementsByTagName("td")[l].innerHTML;
                  }
                }
              }
            }
          }
        }
        {
          // console.log(`Rzeczownik z poza tabeli, zwracam go - ${word}`);
          return word;
        }
      }
      if (czescMowy.includes("przymiotnik")) {
        // console.log("To przymiotnik", word, wikiWord);
        //SPRAWDZ CZY JEST NA LIŚCIE JAKOŚCIOWYCH UNIQUE
        // for (let i = 0; i < uniqueWords.length; i++) {
        //   for (let j = 0; j < uniqueWords[i].length; j++) {
        //     if (uniqueWords[i][j] === wikiWord) {
        //       console.log(uniqueWords[i][j]);
        //       const encodedWikiDepper = encodeURIComponent(foundEquivalent);
        //       const fetchData = await axios.get(
        //         `https://pl.wiktionary.org/wiki/${encodedWikiDepper}`
        //       );
        //       const wikiResponseDeeper = await fetchData.data;
        //       const domWikiDeeper = new JSDOM(wikiResponseDeeper);
        //       const wikiTableDeeper =
        //         domWikiDeeper.window.document.querySelectorAll("tbody tr");
        //     }
        //     if (wikiTableDeeper.length === 0) {
        //       console.log(`Ten bezokolicznik (${word}) nie ma tabeli`);
        //       return word;
        //     }
        //     console.log(
        //       parse(wikiTable[5].innerHTML).getElementsByTagName("td")[1]
        //         .innerHTML
        //     );
        //   }
        // }

        //SPRAWDZ LISTE PRZYMIOTNIKÓW DO PODMIANY
        for (let i = 0; i < adjectiveReplacement.length; i++) {
          for (let j = 0; j < adjectiveReplacement[i].length; j++) {
            if (adjectiveReplacement[i][j] === wikiWord) {
              const foundEquivalent = adjectiveReplacement[i].filter(
                (word) => word !== adjectiveReplacement[i][j]
              )[0];
              // console.log(foundEquivalent);
              for (let k = 8; k >= 2; k--) {
                for (let l = 1; l <= 2; l++) {
                  if (
                    parse(wikiTable[k].innerHTML).getElementsByTagName("td")[l]
                      .innerHTML === word
                  ) {
                    //JAK ZNAJDZIESZ ODPOWIEDNIĄ FORMĘ PRZYMIOTNIKA SZUKAJ FORMY EKWIWALENTU
                    const encodedWikiDepper =
                      encodeURIComponent(foundEquivalent);
                    const fetchData = await axios.get(
                      `https://pl.wiktionary.org/wiki/${encodedWikiDepper}`
                    );
                    const wikiResponseDeeper = await fetchData.data;
                    const domWikiDeeper = new JSDOM(wikiResponseDeeper);
                    const wikiTableDeeper =
                      domWikiDeeper.window.document.querySelectorAll(
                        "tbody tr"
                      );
                    if (wikiTableDeeper.length === 0) {
                      // console.log(`Ten bezokolicznik (${word}) nie ma tabeli`);
                      return word;
                    }
                    // console.log(
                    //   `The result is word ${
                    //     parse(
                    //       wikiTableDeeper[k].innerHTML
                    //     ).getElementsByTagName("td")[k === 5 ? l + 2 : l + 1]
                    //       .innerHTML
                    //   }!!`
                    // );
                    return parse(
                      wikiTableDeeper[k].innerHTML
                    ).getElementsByTagName("td")[k === 5 ? l + 2 : l + 1]
                      .innerHTML;
                  }
                }
              }
            }
          }
        }
        {
          // console.log("Nie ma tego na liście przymiotników", word, wikiWord);
          // SPRAWDZ PRZEDROSTEK
          // if (word.substring(0, 3) === "nie") {
          //   console.log("tne");
          //   word === word.slice(3);
          // }
          const encodedWikiDepper = encodeURIComponent(wikiWord);
          const fetchData = await axios.get(
            `https://pl.wiktionary.org/wiki/${encodedWikiDepper}`
          );
          const wikiResponseDeeper = await fetchData.data;
          const domWikiDeeper = new JSDOM(wikiResponseDeeper);
          const wikiTableDeeper =
            domWikiDeeper.window.document.querySelectorAll("tbody tr");
          if (wikiTableDeeper.length === 0) {
            // console.log(`Ten bezokolicznik (${word}) nie ma tabeli`);
            return word;
          }
          for (let m = 8; m >= 2; m--) {
            for (let n = 1; n <= 2; n++) {
              if (
                parse(wikiTableDeeper[m].innerHTML).getElementsByTagName("td")[
                  n
                ].innerHTML === word
              ) {
                // console.log(
                //   `The result is word ${
                //     parse(wikiTableDeeper[m].innerHTML).getElementsByTagName(
                //       "td"
                //     )[
                //       m === 5
                //         ? n === 1
                //           ? n + 2
                //           : n + 1
                //         : n === 1
                //         ? n + 1
                //         : n - 1
                //     ].innerHTML
                //   }!!`
                // );
                return parse(wikiTableDeeper[m].innerHTML).getElementsByTagName(
                  "td"
                )[m === 5 ? (n === 1 ? n + 2 : n + 1) : n === 1 ? n + 1 : n - 1]
                  .innerHTML;
              }
            }
          }
          // console.log("Failed :( ", word);
          return word;
        }
      }
      if (
        czescMowy.includes("czasownik") &&
        // czescMowy.includes("niedokonany")
        true
      ) {
        // console.log("To czasownik niedokonany");
        const encodedWikiDepper = encodeURIComponent(wikiWord);
        const fetchData = await axios.get(
          `https://pl.wiktionary.org/wiki/${encodedWikiDepper}`
        );
        const wikiResponseDeeper = await fetchData.data;
        const domWikiDeeper = new JSDOM(wikiResponseDeeper);
        const wikiTableDeeper =
          domWikiDeeper.window.document.querySelectorAll("tbody tr");
        if (wikiTableDeeper.length === 0) {
          // console.log(`Ten bezokolicznik (${word}) nie ma tabeli`);
          return word;
        }
        for (let i = 4; i <= 5; i++) {
          for (let j = 0; j <= 5; j++) {
            if (
              parse(wikiTableDeeper[i].innerHTML)
                .getElementsByTagName("td")
                [j].innerHTML.replaceAll(" ", "") === word
            ) {
              // console.log(
              //   `The result is word ${parse(
              //     wikiTableDeeper[i === 4 ? i + 1 : i - 1].innerHTML
              //   )
              //     .getElementsByTagName("td")
              //     [j].innerHTML.replaceAll(" ", "")}!!`
              // );
              return parse(wikiTableDeeper[i === 4 ? i + 1 : i - 1].innerHTML)
                .getElementsByTagName("td")
                [j].innerHTML.replaceAll(" ", "");
            }
          }
        }
        for (let k = 10; k <= 11; k++) {
          for (let l = 0; l <= 5; l++) {
            if (
              parse(wikiTableDeeper[k].innerHTML)
                .getElementsByTagName("td")
                [l].innerHTML.replaceAll(" ", "")
                .split(",")[0]
                .split("</a>")
                .pop() === word
            ) {
              // console.log(
              //   `The result is word ${parse(
              //     wikiTableDeeper[k === 10 ? k + 1 : k - 1].innerHTML
              //   )
              //     .getElementsByTagName("td")
              //     [l].innerHTML.replaceAll(" ", "")
              //     .split(",")[0]
              //     .split("</a>")
              //     .pop()}!!`
              // );
              return parse(wikiTableDeeper[k === 10 ? k + 1 : k - 1].innerHTML)
                .getElementsByTagName("td")
                [l].innerHTML.replaceAll(" ", "")
                .split(",")[0]
                .split("</a>")
                .pop();
            }
          }
        }
        for (let m = 17; m <= 18; m++) {
          for (let n = 0; n <= 5; n++) {
            if (
              parse(wikiTableDeeper[m].innerHTML)
                .getElementsByTagName("td")
                [n].innerHTML.replaceAll(" ", "")
                .split(",")[0] === word
            ) {
              // console.log(
              //   `The result is word ${
              //     parse(wikiTableDeeper[m === 17 ? m + 1 : m - 1].innerHTML)
              //       .getElementsByTagName("td")
              //       [n].innerHTML.replaceAll(" ", "")
              //       .split(",")[0]
              //   }!!`
              // );
              return parse(wikiTableDeeper[m === 17 ? m + 1 : m - 1].innerHTML)
                .getElementsByTagName("td")
                [n].innerHTML.replaceAll(" ", "")
                .split(",")[0];
            }
          }
        }
        // console.log(`failed, zwracam ${word}`);
        return word;
      }
      if (czescMowy.includes("czasownik") && czescMowy.includes("dokonany")) {
        // console.log("This is czasownik dokonany");
        const encodedWikiDepper = encodeURIComponent(wikiWord);
        const fetchData = await axios.get(
          `https://pl.wiktionary.org/wiki/${encodedWikiDepper}`
        );
        const wikiResponseDeeper = await fetchData.data;
        const domWikiDeeper = new JSDOM(wikiResponseDeeper);
        const wikiTableDeeper =
          domWikiDeeper.window.document.querySelectorAll("tbody tr");
        if (wikiTableDeeper.length === 0) {
          // console.log(`Ten bezokolicznik (${word}) nie ma tabeli`);
          return word;
        }

        for (let i = 4; i <= 5; i++) {
          for (let j = 0; j <= 5; j++) {
            if (
              parse(wikiTableDeeper[i].innerHTML)
                .getElementsByTagName("td")
                [j].innerHTML.replaceAll(" ", "") === word
            ) {
              // console.log(
              //   `The result is word ${parse(
              //     wikiTableDeeper[i === 4 ? i + 1 : i - 1].innerHTML
              //   )
              //     .getElementsByTagName("td")
              //     [j].innerHTML.replaceAll(" ", "")}!!`
              // );
              return parse(wikiTableDeeper[i === 4 ? i + 1 : i - 1].innerHTML)
                .getElementsByTagName("td")
                [j].innerHTML.replaceAll(" ", "");
            }
          }
        }
        for (let k = 14; k <= 15; k++) {
          for (let l = 0; l <= 5; l++) {
            if (
              parse(wikiTableDeeper[k].innerHTML)
                .getElementsByTagName("td")
                [l].innerHTML.replaceAll(" ", "")
                .split(",")[0] === word
            ) {
              // console.log(
              //   `The result is word ${
              //     parse(wikiTableDeeper[k === 14 ? k + 1 : k - 1].innerHTML)
              //       .getElementsByTagName("td")
              //       [l].innerHTML.replaceAll(" ", "")
              //       .split(",")[0]
              //   }!!`
              // );
              return parse(wikiTableDeeper[k === 14 ? k + 1 : k - 1].innerHTML)
                .getElementsByTagName("td")
                [l].innerHTML.replaceAll(" ", "")
                .split(",")[0];
            }
          }
        }
        // console.log("failed, zwracam", word);
        return word;
      }
      if (czescMowy.includes("czasownik")) {
        // console.log(`Zwykły czasownik - ${word}`);
        return word;
      }
      // console.log(result);
    } catch (err) {
      // console.log(err);
      // console.log(`Nie udało się zfetchować wiki API, zwracam ${word}`);
      return word;
    }
  };
  return await fetchApiSjp();
};
