"use client";

import { CheckCircle2, Lightbulb, RotateCcw, XCircle } from "lucide-react";
import { useId, useMemo, useState } from "react";
import type { CheckpointQuestion } from "@/lib/learning/content";

type QuestionState = {
  selected: string | null;
  submitted: boolean;
  hintOpen: boolean;
};

const emptyState: QuestionState = {
  selected: null,
  submitted: false,
  hintOpen: false
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Matches a picked option against `question.answer`. Content stores the answer
 * as an option id (`"C"`), but comparing the option text too keeps the check
 * working when an author writes the answer out in full.
 */
function isCorrectOption(
  question: CheckpointQuestion,
  optionId: string
): boolean {
  if (!question.answer) {
    return false;
  }

  const answer = normalize(question.answer);
  const option = question.options.find((candidate) => candidate.id === optionId);

  return (
    normalize(optionId) === answer ||
    (option ? normalize(option.text) === answer : false)
  );
}

function answerLabel(question: CheckpointQuestion): string | null {
  if (!question.answer) {
    return null;
  }

  const option = question.options.find(
    (candidate) =>
      normalize(candidate.id) === normalize(question.answer ?? "") ||
      normalize(candidate.text) === normalize(question.answer ?? "")
  );

  return option ? `${option.id}. ${option.text}` : question.answer;
}

/** Exported so each interaction state can be rendered in isolation. */
export function QuestionCard({
  question,
  index,
  state,
  onChange
}: {
  question: CheckpointQuestion;
  index: number;
  state: QuestionState;
  onChange: (next: QuestionState) => void;
}) {
  const groupId = useId();
  const isSingle = question.type === "single" && question.options.length > 0;
  const correct = state.selected
    ? isCorrectOption(question, state.selected)
    : false;
  const revealed = state.submitted;

  if (!isSingle) {
    // No option list to interact with: show the prompt and keep the answer
    // behind a disclosure so it is never revealed by default.
    return (
      <li className="question-card">
        <p className="question-prompt">
          <span className="question-index">{index + 1}</span>
          {question.question}
        </p>
        {question.hint ? <p className="question-hint">{question.hint}</p> : null}
        {question.answer || question.explanation ? (
          <details className="answer-box">
            <summary>Lihat jawaban</summary>
            {question.answer ? <p>Jawaban: {question.answer}</p> : null}
            {question.explanation ? <p>{question.explanation}</p> : null}
          </details>
        ) : null}
      </li>
    );
  }

  return (
    <li className="question-card">
      <div className="question-head">
        <span className="question-index">{index + 1}</span>
        <p className="question-prompt">{question.question}</p>
      </div>

      {question.difficulty ? (
        <span className="question-difficulty">{question.difficulty}</span>
      ) : null}

      <fieldset className="question-options" disabled={revealed}>
        <legend className="visually-hidden">Pilih satu jawaban</legend>
        {question.options.map((option) => {
          const checked = state.selected === option.id;
          const isAnswer = revealed && isCorrectOption(question, option.id);
          const isWrongPick = revealed && checked && !correct;

          return (
            <label
              className={`question-option${checked ? " picked" : ""}${
                isAnswer ? " correct" : ""
              }${isWrongPick ? " wrong" : ""}`}
              key={option.id}
            >
              <input
                checked={checked}
                name={groupId}
                onChange={() =>
                  onChange({ ...state, selected: option.id })
                }
                type="radio"
                value={option.id}
              />
              <span className="question-option-id">{option.id}</span>
              <span className="question-option-text">{option.text}</span>
            </label>
          );
        })}
      </fieldset>

      <div className="question-actions">
        {revealed ? (
          <button
            className="button secondary"
            onClick={() => onChange({ ...emptyState })}
            type="button"
          >
            <RotateCcw aria-hidden="true" size={17} />
            Coba Lagi
          </button>
        ) : (
          <button
            className="button"
            disabled={!state.selected}
            onClick={() => onChange({ ...state, submitted: true })}
            type="button"
          >
            Periksa Jawaban
          </button>
        )}

        {!revealed && question.hint ? (
          <button
            aria-expanded={state.hintOpen}
            className="button secondary"
            onClick={() => onChange({ ...state, hintOpen: !state.hintOpen })}
            type="button"
          >
            <Lightbulb aria-hidden="true" size={17} />
            {state.hintOpen ? "Sembunyikan Petunjuk" : "Lihat Petunjuk"}
          </button>
        ) : null}
      </div>

      {!revealed && state.hintOpen && question.hint ? (
        <p className="question-hint">{question.hint}</p>
      ) : null}

      {revealed ? (
        <div
          aria-live="polite"
          className={`question-result ${correct ? "correct" : "wrong"}`}
        >
          <p className="question-result-status">
            {correct ? (
              <CheckCircle2 aria-hidden="true" size={18} />
            ) : (
              <XCircle aria-hidden="true" size={18} />
            )}
            {correct ? "Jawabanmu benar!" : "Belum tepat."}
          </p>
          {answerLabel(question) ? (
            <p className="question-result-answer">
              Jawaban benar: {answerLabel(question)}
            </p>
          ) : null}
          {question.explanation ? (
            <p className="question-result-explanation">{question.explanation}</p>
          ) : null}
          {!correct && question.misconceptionTarget ? (
            <p className="question-result-misconception">
              Sering keliru: {question.misconceptionTarget}
            </p>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export function CheckpointQuestions({
  questions,
  completionMessage
}: {
  questions: CheckpointQuestion[];
  completionMessage?: string;
}) {
  const [states, setStates] = useState<Record<string, QuestionState>>({});

  const answerable = useMemo(
    () =>
      questions.filter(
        (question) => question.type === "single" && question.options.length > 0
      ),
    [questions]
  );
  const submittedCount = answerable.filter(
    (question) => states[question.id]?.submitted
  ).length;
  const allSubmitted =
    answerable.length > 0 && submittedCount === answerable.length;

  return (
    <div className="question-set">
      <p className="question-progress">
        {submittedCount} dari {answerable.length} soal sudah diperiksa
      </p>

      <ol className="question-list">
        {questions.map((question, index) => (
          <QuestionCard
            index={index}
            key={question.id}
            onChange={(next) =>
              setStates((current) => ({ ...current, [question.id]: next }))
            }
            question={question}
            state={states[question.id] ?? emptyState}
          />
        ))}
      </ol>

      {allSubmitted && completionMessage ? (
        <p className="question-completion">{completionMessage}</p>
      ) : null}
    </div>
  );
}
