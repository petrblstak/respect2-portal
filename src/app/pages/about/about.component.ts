import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { NgbCarouselConfig } from '@ng-bootstrap/ng-bootstrap';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  providers: [NgbCarouselConfig],
  standalone: false,
})
export class AboutComponent implements OnInit, OnDestroy {
  private readonly config = inject(NgbCarouselConfig);
  private readonly translate = inject(TranslateService);

  private langSub!: Subscription;

  currentLang!: string;
  imgLibUrl = environment.portalBaseUrl + 'assets/img/portals/';
  portals = ['genai', 'jsns', 'hobit', 'asist', 'mesto', 'asistua', 'klima', 'sofa', 'siteraj', 'zcu'];

  portalData = {
    genai: {
      name: 'GeneraceAI',
      text: 'GeneraceAI je EDUportál, který pomáhá studentům porozuměnt umělé inteligenci a připravuje je na budoucnost, ve které bude AI hrát ještě větší roli než nyní.',
      url: 'https://generace.ai',
    },
    jsns: {
      name: 'Kurzy mediálního vzdělávání',
      text: 'EDUportál Kurzy mediálního vzdělávání vytvořený pro JSNS učí žáky a studenty, jak pracovat s informacemi a jak rozumět médiím a problémům s  nimi spojeným. Tento projekt získal ocenění CADUV 2022 Award.',
      url: 'https://onlinekurzy.jsns.cz',
    },
    hobit: {
      name: 'Hobit',
      text: 'Pomocí EDUportálů Hobit (Hodina biologie pro život) získávají žáci vědomosti, které jim pomohou včas rozpoznat mrtvici nebo infarkt a správně v takové situaci zareagovat.',
      url: 'https://programhobit.cz',
    },
    asist: {
      name: 'Společně k lepší škole',
      text: 'Tento EDUportál pomáhá připravovat asistenty pedagoga na práci se sociálně znevýhodněnými dětmi a na to, jak je podpořit ve vzdělávání.',
      url: 'https://kurz-lepsiskola.clovekvtisni.cz',
    },
    mesto: {
      name: 'Žijeme městem',
      text: 'EDUportál Žijeme městem je určen žákům druhého stupně ZŠ a klade si za cíl podpořit jejich zájem o město, ve kterém žijí, a motivovat je k tomu, aby byli ochotní podílet se na pozitivních změnách ve svém okolí.',
      url: 'https://kurz-zijememestem.clovekvtisni.cz',
    },
    asistua: {
      name: 'Kurz češtiny pro pedagogy',
      text: 'EDUportál Kurz češtiny pro pedagogy pomáhá ukrajinským asistentům pedagoga zdokonalit se v češtině a lépe se tak adaptovat na nové pracovní prostředí v českých školách.',
      url: 'https://kurz-cestiny.clovekvtisni.cz',
    },
    klima: {
      name: 'Klimatická změna + Labyrint Migrace',
      text: 'Tento EDUportál slučuje dva kurzy, kurz Klimatická změna a kurz Labyrint migrace. Je určen pedagogům středních škol a druhého stupně základních škol a poskyuje jim informační a metodickou podporu pro výuku těchto globálních témat.',
      url: 'https://mojekurzy.clovekvtisni.cz',
    },
    sofa: {
      name: 'Karta KID',
      text: 'EDUportál, který učí pedagogy, sociální a zdravotní pracovníky a složky integrovaného záchranného systému, jak včas identifikovat ohrožené děti a poskytuje konkrétní nástroje, jak těmto dětem efektivně a citlivě pomoci.',
      url: 'https://www.kartakid.cz',
    },
    siteraj: {
      name: 'Labyrint sítě a ráj srdce',
      text: 'Tento EDUportál je určen pedagogům, rodičům a všem, kdo mají zájem vést děti ke zdravému a spokojenému životu s digitálními technologiemi. Učí, jak děti podporovat, aby využívaly online prostředí bezpečně, zodpovědně a zároveň se v něm cítily dobře.',
      url: 'https://siteraj.cz',
    },
    zcu: {
      name: 'Inkluze na VŠ v příbězích',
      text: 'Tento EDUportál učí studenty, vyučující i další personál VŠ, jak vytvářet na vysokých školách inkluzivní vzdělávací prostředí, ve kterém je všem dobře.',
      url: 'https://zcu.competent.cz',
    },
  } as { [key: string]: { name: string; text: string; url: string } };

  images = {
    genai: ['1.png', '2.png', '3.png', '4.png', '5.png'],
    jsns: ['1.png', '2.png', '3.png', '4.png', '5.png'],
    hobit: ['1.png', '2.png', '3.png', '4.png'],
    asist: ['1.png', '2.png', '3.png', '4.png'],
    mesto: ['1.png', '2.png', '3.png', '4.png'],
    asistua: ['1.png', '2.png', '3.png'],
    klima: ['1.png', '2.png', '3.png', '4.png'],
    sofa: ['1.png', '2.png', '3.png', '4.png'],
    siteraj: ['1.png', '2.png', '3.png', '4.png'],
    zcu: ['1.png', '2.png', '3.png', '4.png', '5.png'],
  } as { [key: string]: string[] };

  ngOnInit(): void {
    this.currentLang = this.translate.getCurrentLang();
    this.config.showNavigationArrows = true;
    this.config.showNavigationIndicators = true;
    this.config.interval = 5000;
    this.config.pauseOnHover = true;
    this.langSub = this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.currentLang = event.lang;
    });
  }

  ngOnDestroy() {
    this.langSub.unsubscribe();
  }
}
