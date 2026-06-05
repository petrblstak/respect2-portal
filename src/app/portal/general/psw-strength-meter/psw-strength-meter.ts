import { AfterViewInit, Component, Input, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

// Declare the global function from pswmeter.min.js
declare function passwordStrengthMeter(options: any): any;

@Component({
  selector: 'cmp-psw-strength-meter',
  templateUrl: './psw-strength-meter.html',
  styleUrl: './psw-strength-meter.scss',
  standalone: false,
})
export class PswStrengthMeterComponent implements AfterViewInit {
  // Dependencies
  private readonly translate = inject(TranslateService);

  @Input({ required: true }) pswStrengthPolicy: string | null = null;
  @Input({ required: true }) pswInputId!: string;

  // Component data and state
  pwdSettings = {
    pwdRules: '',
    pwdMinLength: 6,
  };

  ngAfterViewInit(): void {
    if (this.pswStrengthPolicy == null || this.pswStrengthPolicy.length <= 0) {
      this.pwdSettings.pwdRules = this.translate.instant('PASSWORD_RULES_NONE');
    } else {
      var pwdConfig = JSON.parse(this.pswStrengthPolicy);
      this.pwdSettings.pwdRules = this.createRulesDescription(pwdConfig);
      this.pwdSettings.pwdMinLength = pwdConfig && pwdConfig.minCharacters > 0 ? pwdConfig.minCharacters : 6;
    }

    passwordStrengthMeter({
      containerElement: '#id-psw-meter',
      passwordInput: '#' + this.pswInputId,
      showMessage: true,
      messageContainer: '#id-pswmeter-message',
      messagesList: [
        this.translate.instant('PASSWORD_STRENGTH_MESSAGE_0'),
        this.translate.instant('PASSWORD_STRENGTH_MESSAGE_1'),
        this.translate.instant('PASSWORD_STRENGTH_MESSAGE_2'),
        this.translate.instant('PASSWORD_STRENGTH_MESSAGE_3'),
        this.translate.instant('PASSWORD_STRENGTH_MESSAGE_4'),
      ],
      height: 8,
      borderRadius: 5,
      pswMinLength: this.pwdSettings.pwdMinLength,
      colorScore1: '#dc3545',
      colorScore2: '#ffc107',
      colorScore3: '#90ee90',
      colorScore4: '#44b1ad',
    });
  }

  // Helper function to check if value is active (not null, not 0, not false)
  isRuleActive(value: any) {
    return value != null && value !== 0 && value !== false;
  }

  createRulesDescription(settings: any) {
    if (settings == null) {
      return this.translate.instant('PASSWORD_RULES_NONE');
    }
    // Build pwdRules string from active rules
    var rules = [];
    if (this.isRuleActive(settings.minCharacters)) {
      rules.push(this.translate.instant('PASSWORD_RULES_MIN_LENGTH') + ': ' + settings.minCharacters);
    }

    if (this.isRuleActive(settings.maxCharacters)) {
      rules.push(this.translate.instant('PASSWORD_RULES_MAX_LENGTH') + ': ' + settings.maxCharacters);
    }

    if (this.isRuleActive(settings.minSpecialCharacters)) {
      rules.push(this.translate.instant('PASSWORD_RULES_MIN_SPECIAL_CHARACTERS') + ': ' + settings.minSpecialCharacters);
    }

    if (this.isRuleActive(settings.minUpperCaseLetters)) {
      rules.push(this.translate.instant('PASSWORD_RULES_MIN_UPPER_CASE_LETTERS') + ': ' + settings.minUpperCaseLetters);
    }

    if (this.isRuleActive(settings.minLowerCaseLetters)) {
      rules.push(this.translate.instant('PASSWORD_RULES_MIN_LOWER_CASE_LETTERS') + ': ' + settings.minLowerCaseLetters);
    }

    if (this.isRuleActive(settings.minNumbers)) {
      rules.push(this.translate.instant('PASSWORD_RULES_MIN_NUMBERS') + ': ' + settings.minNumbers);
    }

    if (this.isRuleActive(settings.maxAlphabeticalSequence)) {
      rules.push(this.translate.instant('PASSWORD_RULES_MAX_ALPHA_SEQUENCE_LENGTH') + ': ' + settings.maxAlphabeticalSequence);
    }

    if (this.isRuleActive(settings.maxNumericalSequence)) {
      rules.push(this.translate.instant('PASSWORD_RULES_MAX_NUMERIC_SEQUENCE_LENGTH') + ': ' + settings.maxNumericalSequence);
    }

    if (this.isRuleActive(settings.maxKeyboardSequence)) {
      rules.push(this.translate.instant('PASSWORD_RULES_MIN_KEY_SEQUENCE_LENGTH') + ': ' + settings.maxKeyboardSequence);
    }

    if (this.isRuleActive(settings.maxRepeatedCharacters)) {
      rules.push(this.translate.instant('PASSWORD_RULES_MIN_REPEATED_CHARACTERS') + ': ' + settings.maxRepeatedCharacters);
    }

    if (this.isRuleActive(settings.restrictLogin)) {
      rules.push(this.translate.instant('PASSWORD_RULES_MIN_USERNAME'));
    }

    if (this.isRuleActive(settings.restrictEmail)) {
      rules.push(this.translate.instant('PASSWORD_RULES_MIN_EMAIL'));
    }

    if (this.isRuleActive(settings.restrictWhitespaces)) {
      rules.push(this.translate.instant('PASSWORD_RULES_MIN_WHITESPACE'));
    }

    // Join rules with HTML line break
    return rules.length > 0 ? rules.join('<br>') : this.translate.instant('PASSWORD_RULES_NONE');
  }
}
