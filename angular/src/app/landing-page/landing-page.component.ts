import { getRandomIndex } from './../../utils/index';
import { Component, OnInit } from '@angular/core';
import { HighlightAutoResult } from 'ngx-highlightjs';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ImageOptimizerService } from '../shared/services/image-optimizer.service';
import { CodeSnippetService } from '../shared/services/code-snippet.service';
import { FileAndSize } from '../shared/components/image-input/image-input.component';
import { HttpEventType } from '@angular/common/http';
import {
  OptimizationConfig,
  OptimizationConfigForm,
} from '../shared/services/image-optimizer.types';
import { extractFileName } from 'src/utils';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss'],
})
export class LandingPageComponent implements OnInit {
  optimizationConfig: FormGroup;
  response?: HighlightAutoResult;
  file: FileAndSize | null = null;

  zipId: string = '';
  zipUrl: string = './';
  zipName: string = '<IMAGE_NAME>';

  currentOptimizationConfig?: OptimizationConfig;

  imagePlaceholder: string = '<IMAGE_PLACEHOLDER>';
  splashColor: string = getRandomIndex([
    '#FF0000',
    '#FF8200',
    '#FFC100',
    '#FFEAAE',
  ]);

  isLoading: boolean = false;

  constructor(
    private imageOptimizerService: ImageOptimizerService,
    public codeSnippetService: CodeSnippetService,
    private formBuilder: FormBuilder
  ) {
    this.optimizationConfig = ImageOptimizerService.getOptimizationConfigForm();
  }

  syncFile(file: FileAndSize): void {
    this.file = file;
  }

  ngOnInit(): void {}

  onSubmit(event: Event): void {
    event.preventDefault();
    this.setZipId('');

    if (!this.file) return;

    let config = ImageOptimizerService.processOptimizationConfigForm(
      this.optimizationConfig.getRawValue() as OptimizationConfigForm
    );

    this.isLoading = true;
    this.imageOptimizerService
      .optimize(this.file, config)
      .subscribe((event: any) => {
        if (event.type === HttpEventType.DownloadProgress) {
          console.log('download progress');
        }

        if (event.type === HttpEventType.Response) {
          this.isLoading = false;
          this.setZipId(event.body.data.id);

          this.currentOptimizationConfig = config;
          this.imagePlaceholder = event.body.data.placeholder;
        }
      });
  }

  onHighlight(e: HighlightAutoResult) {
    this.response = {
      language: e.language,
      relevance: e.relevance,
      secondBest: '{...}',
      value: '{...}',
    };
  }

  setZipId(value: string) {
    this.zipId = value;
    this.zipUrl = `/storage/${value}`;
    this.zipName = value;
  }

  getSnippetData() {
    return {
      placeholder: this.imagePlaceholder,
      dimension: this.file?.dimension || { width: 0, height: 0 },
      folderName: this.zipName,
      availableImageSizes: this.currentOptimizationConfig?.sizes || [],
      availableImageFormat: this.currentOptimizationConfig || {},
    };
  }
}
