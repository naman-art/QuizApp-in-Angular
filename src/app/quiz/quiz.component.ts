import { Component, OnInit } from '@angular/core';
import { ChartType } from 'chart.js';
import { QuizService } from '../services/quiz.service';
import { HelperService } from '../services/helper.service';
import { Option, Question, Quiz, QuizConfig } from '../models/index';
import { ChartsModule, Label, MultiDataSet } from 'ng2-charts';

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css'],
  providers: [QuizService],
})
export class QuizComponent implements OnInit {
  doughnutChartLabels: Label[] = [];
  doughnutChartData: MultiDataSet = [];
  doughnutChartType: ChartType = 'doughnut';
  no_of_time_displayAns: number = 0;
  ishidden: boolean = false;
  correctans: number = 0;
  attempted: number = 0;
  disans: string[] = [];
  quizes: any[] = [];
  iscorrect: number = 0;
  sum: number = 0;
  quiz: Quiz = new Quiz(null);
  mode = 'info';
  quizName: string = '';
  isdisable: boolean = false;
  config: QuizConfig = {
    allowBack: true,
    allowReview: true,
    autoMove: false, // if true, it will move to next question automatically when answered.
    duration: 300, // indicates the time (in secs) in which quiz needs to be completed. 0 means unlimited.
    pageSize: 1,
    requiredAll: false, // indicates if you must answer all the questions before submitting.
    richText: false,
    shuffleQuestions: false,
    shuffleOptions: false,
    showClock: false,
    showPager: true,
  };

  pager = {
    index: 0,
    size: 1,
    count: 1,
  };
  timer: any = null;
  startTime: Date = new Date();
  endTime: Date = new Date();
  ellapsedTime = '00:00';
  duration = '';

  constructor(private quizService: QuizService) {}

  ngOnInit() {
    this.quizes = this.quizService.getAll();
    this.quizName = this.quizes[0].id;
    setTimeout(() => {
      this.loadQuiz(this.quizName);
    }, 5000);
  }

  loadQuiz(quizName: string) {
    //loading jsons

    setTimeout(() => {
      this.ishidden = true;
      this.quizService.get(quizName).subscribe((res) => {
        this.quiz = new Quiz(res);
        this.pager.count = this.quiz.questions.length;
        this.startTime = new Date();
        this.ellapsedTime = '00:00';

        this.timer = setInterval(() => {
          this.tick();
        }, 1000);
        this.duration = this.parseTime(this.config.duration);
      });
      this.mode = 'quiz';
    }, 500);
  }

  tick() {
    const now = new Date();
    const diff = (now.getTime() - this.startTime.getTime()) / 1000;
    if (diff >= this.config.duration) {
      this.onSubmit();
    }
    this.ellapsedTime = this.parseTime(diff);
  }

  parseTime(totalSeconds: number) {
    let mins: string | number = Math.floor(totalSeconds / 60);
    let secs: string | number = Math.round(totalSeconds % 60);
    mins = (mins < 10 ? '0' : '') + mins;
    secs = (secs < 10 ? '0' : '') + secs;
    return `${mins}:${secs}`;
  }

  get filteredQuestions() {
    return this.quiz.questions
      ? this.quiz.questions.slice(
          this.pager.index,
          this.pager.index + this.pager.size
        )
      : [];
  }

  onSelect(question: Question, option: Option) {
    if (question.questionTypeId === 1) {
      this.attempted++;

      question.options.forEach((x) => {
        if (x.id === option.id && option.isAnswer) {
          this.correctans++;
          if (this.correctans > 10) {
            this.correctans = 10;
          }
        }
        if (x.id !== option.id) {
          x.selected = false;
        }
      });
    }
    setTimeout(() => {
      if (this.config.autoMove) {
        this.goTo(this.pager.index + 1);
      }
    }, 100);
  }

  goTo(index: number) {
    if (index >= 0 && index < this.pager.count) {
      this.pager.index = index;
      this.mode = 'quiz';
    }
  }

  isAnswered(question: Question) {
    return question.options.find((x) => x.selected)
      ? 'Answered'
      : 'Not Answered';
  }

  isCorrect(question: Question) {
    let ans = question.options.every((x) => x.selected === x.isAnswer)
      ? 'correct'
      : 'wrong';
    return ans;
  }

  counter = 0;
  displayResult() {
    if (this.no_of_time_displayAns < 1) {
      this.no_of_time_displayAns++;
      this.quiz.questions.forEach((x) =>
        x.options.forEach((y) => {
          if (y.isAnswer === true) {
            let quesid = y.id;
            if (quesid == 1055) {
              this.disans.push('a');
            } else if (quesid == 1056) {
              this.disans.push('b');
            } else if (quesid == 1057) {
              this.disans.push('c');
            } else {
              this.disans.push('d');
            }
          }
        })
      );
    }
  }

  onDetailresult() {
    let answers = [];
    this.quiz.questions.forEach((x) =>
      answers.push({
        quizId: this.quiz.id,
        questionId: x.id,
        answered: x.answered,
      })
    );
    this.mode = 'detailresult';
  }

  onSubmit() {
    this.doughnutChartLabels = [
      'Correct Answers',
      'Incorrect Answers',
      'Attempted',
      'Unattempted',
    ];
    this.doughnutChartData = [
      [0, 0, this.attempted, 10 - this.attempted],
      [this.correctans, 10 - this.correctans, 0, 0],
    ];
    this.config.duration = this.config.duration * 20;

    this.mode = 'result';
  }
}
