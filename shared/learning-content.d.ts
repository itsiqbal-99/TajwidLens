export interface LearningReference {id:string;title:string;publisher:string;url:string;pages?:number;scope:string;note:string}
export interface StudyReference {id:string;page?:number;location:string}
export interface StudyConcept {id:string;title:string;explanation:string;examples?:{arabic:string;reading:string;note:string}[]}
export interface LessonStudy {lessonId:string;intro:string;objectives:string[];concepts:StudyConcept[];references:StudyReference[];steps?:string[];practice?:{prompt:string;answer:string}[]}
